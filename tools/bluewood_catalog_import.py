#!/usr/bin/env python3
"""Fetch Bluewood products and generate/import Product Catalog SQL.

The script uses Bluewood's public WooCommerce Store API, maps the data to this
project's product-catalog schema, and writes an idempotent replacement seed.
Use --apply only when you want to replace the running Docker database data.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import unicodedata
from dataclasses import dataclass, field
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_URL = "https://bluewood.vn"
STORE_PRODUCTS_URL = f"{BASE_URL}/wp-json/wc/store/v1/products"
DEFAULT_OUTPUT = Path("product-catalog-service/src/main/resources/data.sql")
DOCKER_SQL_PATH = "/tmp/bluewood_catalog_import.sql"

LABEL_KEYS = {
    "kich-thuoc": "Kich thuoc",
    "kich-thuoc-ghe": "Kich thuoc",
    "quy-cach": "Quy cach",
    "chat-lieu": "Chat lieu",
    "mau-sac": "Mau sac",
    "phong-cach": "Phong cach",
    "cong-nang": "Cong nang",
    "ung-dung": "Ung dung",
    "bao-hanh": "Bao hanh",
}

MATERIAL_LABELS = {"chat-lieu"}
COLOR_LABELS = {"mau-sac"}
DIMENSION_LABELS = {"kich-thuoc", "kich-thuoc-ghe"}
WARRANTY_LABELS = {"bao-hanh"}


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        text = data.strip()
        if text:
            self.parts.append(text)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"br", "p", "li", "h1", "h2", "h3", "h4"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"p", "li", "h1", "h2", "h3", "h4"}:
            self.parts.append("\n")

    def text(self) -> str:
        raw = " ".join(self.parts)
        raw = unescape(raw)
        raw = re.sub(r"[ \t\r\f\v]+", " ", raw)
        raw = re.sub(r"\n\s+", "\n", raw)
        raw = re.sub(r"\n{3,}", "\n\n", raw)
        return raw.strip()


@dataclass
class CategorySeed:
    id: int
    name: str
    slug: str
    display_order: int
    image_url: str | None = None


@dataclass
class ImageSeed:
    id: int
    product_id: int
    url: str
    alt: str
    display_order: int
    primary: bool


@dataclass
class SpecSeed:
    id: int
    product_id: int
    key: str
    label: str
    value: str
    display_order: int


@dataclass
class ProductSeed:
    id: int
    name: str
    slug: str
    sku: str
    price: int
    description: str
    category_id: int
    category_name: str
    availability: int
    image_url: str | None
    room: str | None = None
    material: str | None = None
    color: str | None = None
    dimensions: str | None = None
    collection: str | None = "Bluewood"
    warranty: str | None = None
    weight_kg: float | None = None
    images: list[ImageSeed] = field(default_factory=list)
    specs: list[SpecSeed] = field(default_factory=list)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crawl Bluewood products and replace product-catalog seed data."
    )
    parser.add_argument("--limit", type=int, default=120, help="Maximum products to import. Use 0 for all.")
    parser.add_argument("--per-page", type=int, default=100, help="WooCommerce page size.")
    parser.add_argument("--delay", type=float, default=0.25, help="Delay between API pages in seconds.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="SQL output path.")
    parser.add_argument("--base-url", default=BASE_URL, help="Bluewood base URL.")
    parser.add_argument("--apply", action="store_true", help="Apply SQL to the running Docker PostgreSQL container.")
    parser.add_argument("--container", default="ecom-postgres", help="PostgreSQL Docker container name.")
    parser.add_argument("--db", default="product_catalog", help="Target PostgreSQL database.")
    parser.add_argument("--user", default="postgres", help="Target PostgreSQL user.")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and summarize without writing SQL.")
    return parser.parse_args()


def fetch_json(url: str, params: dict[str, Any], timeout: int = 30) -> tuple[Any, dict[str, str]]:
    full_url = f"{url}?{urlencode(params)}"
    request = Request(
        full_url,
        headers={
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; e-commerce-microservices-bluewood-import/1.0)",
        },
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            headers = {key.lower(): value for key, value in response.headers.items()}
            return json.loads(body), headers
    except HTTPError as exc:
        raise RuntimeError(f"HTTP {exc.code} while fetching {full_url}") from exc
    except URLError as exc:
        raise RuntimeError(f"Network error while fetching {full_url}: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid JSON returned by {full_url}") from exc


def strip_html(value: str | None) -> str:
    if not value:
        return ""
    parser = TextExtractor()
    parser.feed(value)
    return parser.text()


def normalize_key(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    ascii_text = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    ascii_text = ascii_text.replace("đ", "d").replace("Đ", "D")
    ascii_text = ascii_text.lower()
    ascii_text = re.sub(r"[^a-z0-9]+", "-", ascii_text)
    return ascii_text.strip("-")


def compact(value: str | None, max_len: int | None = None) -> str | None:
    if value is None:
        return None
    text = re.sub(r"\s+", " ", value).strip()
    if not text:
        return None
    if max_len and len(text) > max_len:
        if max_len <= 3:
            return text[:max_len]
        return text[: max_len - 3].rstrip() + "..."
    return text


def sql_string(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value)
    return "'" + text.replace("'", "''") + "'"


def parse_price(product: dict[str, Any]) -> int:
    prices = product.get("prices") or {}
    for key in ("price", "sale_price", "regular_price"):
        raw = prices.get(key)
        if raw is None or raw == "":
            continue
        digits = re.sub(r"\D+", "", str(raw))
        if digits:
            return int(digits)
    return 0


def extract_labeled_specs(html: str | None) -> dict[str, str]:
    text = strip_html(html)
    specs: dict[str, str] = {}
    if not text:
        return specs

    lines = [line.strip(" -:") for line in re.split(r"[\n]+", text) if line.strip(" -:")]
    index = 0
    while index < len(lines):
        line = lines[index]
        if ":" not in line:
            index += 1
            continue
        label, value = line.split(":", 1)
        key = normalize_key(label)
        if key not in LABEL_KEYS:
            index += 1
            continue

        chunks = [value.strip()] if value.strip() else []
        lookahead = index + 1
        while lookahead < len(lines):
            next_line = lines[lookahead]
            if ":" in next_line:
                next_label = normalize_key(next_line.split(":", 1)[0])
                if next_label in LABEL_KEYS:
                    break
            chunks.append(next_line)
            lookahead += 1

        value = compact("; ".join(chunk for chunk in chunks if chunk), 500)
        if value and key not in specs:
            specs[key] = value
        index = max(lookahead, index + 1)
    return specs


def extract_color(product: dict[str, Any]) -> str | None:
    values: list[str] = []
    for attribute in product.get("attributes") or []:
        name_key = normalize_key(attribute.get("name") or "")
        if "mau" not in name_key and "color" not in name_key:
            continue
        for term in attribute.get("terms") or []:
            name = compact(term.get("name"), 80)
            if name:
                values.append(name)
    for variation in product.get("variations") or []:
        for attribute in variation.get("attributes") or []:
            name_key = normalize_key(attribute.get("name") or "")
            if "mau" not in name_key and "color" not in name_key:
                continue
            name = compact(attribute.get("value"), 80)
            if name:
                values.append(name)
    deduped = list(dict.fromkeys(values))
    return ", ".join(deduped[:4]) if deduped else None


def product_description(product: dict[str, Any]) -> str:
    short = strip_html(product.get("short_description"))
    full = strip_html(product.get("description"))
    description = short or full
    if not description:
        description = product.get("name") or "San pham Bluewood"
    return compact(description, 2000) or "San pham Bluewood"


def first_image(product: dict[str, Any]) -> str | None:
    for image in product.get("images") or []:
        src = compact(image.get("src"), 500)
        if src:
            return src
    return None


def preferred_category(product: dict[str, Any]) -> dict[str, Any]:
    categories = product.get("categories") or []
    if not categories:
        return {"id": 1, "name": "Bluewood", "slug": "bluewood"}
    return categories[-1]


def fetch_products(base_url: str, per_page: int, limit: int, delay: float) -> list[dict[str, Any]]:
    url = f"{base_url.rstrip('/')}/wp-json/wc/store/v1/products"
    products: list[dict[str, Any]] = []
    seen_ids: set[int] = set()
    page = 1
    total_pages: int | None = None

    while True:
        data, headers = fetch_json(url, {"per_page": per_page, "page": page})
        if not isinstance(data, list):
            raise RuntimeError("Bluewood products API did not return a list")
        if not data:
            break
        added = 0
        for product in data:
            raw_id = product.get("id")
            if raw_id is None:
                continue
            product_id = int(raw_id)
            if product_id in seen_ids:
                continue
            seen_ids.add(product_id)
            products.append(product)
            added += 1
        print(f"Fetched page {page}: {len(data)} raw, {added} new, total {len(products)}")

        if limit > 0 and len(products) >= limit:
            products = products[:limit]
            break

        if total_pages is None:
            raw_total_pages = headers.get("x-wp-totalpages")
            total_pages = int(raw_total_pages) if raw_total_pages and raw_total_pages.isdigit() else None

        page += 1
        if total_pages is not None and page > total_pages:
            break
        if delay > 0:
            time.sleep(delay)

    return products


def fetch_category_images(base_url: str) -> dict[int, str]:
    url = f"{base_url.rstrip('/')}/wp-json/wc/store/v1/products/categories"
    images_map: dict[int, str] = {}
    page = 1
    while True:
        try:
            data, _ = fetch_json(url, {"per_page": 100, "page": page})
            if not isinstance(data, list) or not data:
                break
            for cat in data:
                cat_id = cat.get("id")
                img = cat.get("image") or {}
                src = img.get("src") if isinstance(img, dict) else None
                if cat_id is not None and src:
                    images_map[int(cat_id)] = src
            page += 1
        except Exception as exc:
            print(f"Warning: failed to fetch category images page {page}: {exc}")
            break
    return images_map


def build_seed(products: list[dict[str, Any]], category_images: dict[int, str]) -> tuple[list[CategorySeed], list[ProductSeed]]:
    category_map: dict[int, CategorySeed] = {}
    category_order = 10
    image_id = 1
    spec_id = 1
    used_skus: set[str] = set()
    seeded_products: list[ProductSeed] = []

    for product in products:
        for category in product.get("categories") or []:
            category_id = int(category.get("id") or 1)
            category_image_url = category_images.get(category_id)
            if category_id not in category_map:
                category_map[category_id] = CategorySeed(
                    id=category_id,
                    name=compact(category.get("name"), 120) or "Bluewood",
                    slug=compact(category.get("slug"), 140) or f"bluewood-{category_id}",
                    display_order=category_order,
                    image_url=category_image_url,
                )
                category_order += 10
            elif not category_map[category_id].image_url and category_image_url:
                category_map[category_id].image_url = category_image_url

        selected_category = preferred_category(product)
        selected_category_id = int(selected_category.get("id") or 1)
        selected_category_image_url = category_images.get(selected_category_id)
        if selected_category_id not in category_map:
            category_map[selected_category_id] = CategorySeed(
                id=selected_category_id,
                name=compact(selected_category.get("name"), 120) or "Bluewood",
                slug=compact(selected_category.get("slug"), 140) or f"bluewood-{selected_category_id}",
                display_order=category_order,
                image_url=selected_category_image_url,
            )
            category_order += 10
        elif not category_map[selected_category_id].image_url and selected_category_image_url:
            category_map[selected_category_id].image_url = selected_category_image_url

        product_id = int(product.get("id"))
        specs_by_key = extract_labeled_specs(product.get("short_description"))
        sku = compact(product.get("sku"), 120) or f"BLUEWOOD-{product_id}"
        if sku in used_skus:
            sku = f"{sku}-{product_id}"
        used_skus.add(sku)
        image_url = first_image(product)
        seeded = ProductSeed(
            id=product_id,
            name=compact(product.get("name"), 255) or f"Bluewood product {product_id}",
            slug=compact(product.get("slug"), 255) or f"bluewood-{product_id}",
            sku=sku,
            price=parse_price(product),
            description=product_description(product),
            category_id=selected_category_id,
            category_name=category_map[selected_category_id].name,
            availability=1 if product.get("is_in_stock", True) else 0,
            image_url=image_url,
            material=next((value for key, value in specs_by_key.items() if key in MATERIAL_LABELS), None),
            color=next((value for key, value in specs_by_key.items() if key in COLOR_LABELS), None) or extract_color(product),
            dimensions=next((value for key, value in specs_by_key.items() if key in DIMENSION_LABELS), None),
            warranty=next((value for key, value in specs_by_key.items() if key in WARRANTY_LABELS), None),
        )
        seeded.material = compact(seeded.material, 255)
        seeded.color = compact(seeded.color, 255)
        seeded.dimensions = compact(seeded.dimensions, 255)
        seeded.collection = compact(seeded.collection, 255)
        seeded.sku = compact(seeded.sku, 255) or f"BLUEWOOD-{product_id}"
        seeded.slug = compact(seeded.slug, 255) or f"bluewood-{product_id}"
        seeded.warranty = compact(seeded.warranty, 255)

        for index, image in enumerate(product.get("images") or []):
            src = compact(image.get("src"), 500)
            if not src:
                continue
            seeded.images.append(
                ImageSeed(
                    id=image_id,
                    product_id=product_id,
                    url=src,
                    alt=compact(image.get("alt") or seeded.name, 200) or seeded.name,
                    display_order=index,
                    primary=index == 0,
                )
            )
            image_id += 1

        for key, value in specs_by_key.items():
            seeded.specs.append(
                SpecSeed(
                    id=spec_id,
                    product_id=product_id,
                    key=key,
                    label=LABEL_KEYS.get(key, key.replace("-", " ").title()),
                    value=value,
                    display_order=len(seeded.specs),
                )
            )
            spec_id += 1

        seeded_products.append(seeded)

    categories = sorted(category_map.values(), key=lambda item: (item.display_order, item.name))
    return categories, seeded_products


def sql_values(rows: list[str]) -> str:
    return ",\n".join(rows) + ";\n"


def generate_sql(categories: list[CategorySeed], products: list[ProductSeed]) -> str:
    images = [image for product in products for image in product.images]
    specs = [spec for product in products for spec in product.specs]

    lines: list[str] = [
        "-- Generated by tools/bluewood_catalog_import.py from https://bluewood.vn/",
        "-- This replaces only product catalog seed data.",
        "BEGIN;",
        "ALTER TABLE categories ALTER COLUMN description TYPE varchar(1000);",
        "ALTER TABLE categories ALTER COLUMN image_url TYPE varchar(500);",
        "ALTER TABLE products ALTER COLUMN discription TYPE varchar(2000);",
        "ALTER TABLE products ALTER COLUMN image_url TYPE varchar(500);",
        "ALTER TABLE product_images ALTER COLUMN image_url TYPE varchar(500);",
        "ALTER TABLE product_images ALTER COLUMN alt_text TYPE varchar(200);",
        "ALTER TABLE product_specifications ALTER COLUMN spec_key TYPE varchar(120);",
        "ALTER TABLE product_specifications ALTER COLUMN spec_label TYPE varchar(160);",
        "ALTER TABLE product_specifications ALTER COLUMN spec_value TYPE varchar(500);",
        "TRUNCATE TABLE product_specifications, product_images, products, categories RESTART IDENTITY CASCADE;",
        "",
    ]

    category_rows = [
        "("
        + ", ".join(
            [
                sql_string(category.id),
                sql_string(category.name),
                sql_string(category.slug),
                sql_string(f"Danh muc san pham crawl tu Bluewood: {category.name}"),
                sql_string(category.image_url),
                sql_string(category.display_order),
                "true",
                "NULL",
            ]
        )
        + ")"
        for category in categories
    ]
    lines.append("INSERT INTO categories (id, name, slug, description, image_url, display_order, active, parent_id) VALUES")
    lines.append(sql_values(category_rows))

    product_rows = []
    for product in products:
        product_rows.append(
            "("
            + ", ".join(
                [
                    sql_string(product.id),
                    sql_string(product.name),
                    sql_string(product.price),
                    sql_string(product.description),
                    sql_string(product.category_name),
                    sql_string(product.availability),
                    sql_string(product.image_url),
                    sql_string(product.room),
                    sql_string(product.material),
                    sql_string(product.color),
                    sql_string(product.dimensions),
                    sql_string(product.collection),
                    sql_string(product.sku),
                    sql_string(product.slug),
                    sql_string(product.warranty),
                    sql_string(product.weight_kg),
                    sql_string(product.category_id),
                ]
            )
            + ")"
        )
    lines.append(
        "INSERT INTO products (id, product_name, price, discription, category, availability, image_url, room, material, color, dimensions, collection, sku, slug, warranty, weight_kg, category_id) VALUES"
    )
    lines.append(sql_values(product_rows))

    if images:
        image_rows = [
            "("
            + ", ".join(
                [
                    sql_string(image.id),
                    sql_string(image.url),
                    sql_string(image.alt),
                    sql_string(image.display_order),
                    sql_string(image.primary),
                    sql_string(image.product_id),
                ]
            )
            + ")"
            for image in images
        ]
        lines.append("INSERT INTO product_images (id, image_url, alt_text, display_order, primary_image, product_id) VALUES")
        lines.append(sql_values(image_rows))

    if specs:
        spec_rows = [
            "("
            + ", ".join(
                [
                    sql_string(spec.id),
                    sql_string(spec.key),
                    sql_string(spec.label),
                    sql_string(spec.value),
                    sql_string(spec.display_order),
                    sql_string(spec.product_id),
                ]
            )
            + ")"
            for spec in specs
        ]
        lines.append(
            "INSERT INTO product_specifications (id, spec_key, spec_label, spec_value, display_order, product_id) VALUES"
        )
        lines.append(sql_values(spec_rows))

    for table in ("categories", "products", "product_images", "product_specifications"):
        lines.append(
            f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 1), true);"
        )
    lines.append("COMMIT;")
    lines.append("")
    return "\n".join(lines)


def write_sql(path: Path, sql: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(sql, encoding="utf-8", newline="\n")


def run_command(command: list[str]) -> None:
    print("+ " + " ".join(command))
    subprocess.run(command, check=True)


def apply_to_docker(sql_path: Path, container: str, db: str, user: str) -> None:
    run_command(["docker", "cp", str(sql_path), f"{container}:{DOCKER_SQL_PATH}"])
    run_command(["docker", "exec", container, "psql", "-U", user, "-d", db, "-v", "ON_ERROR_STOP=1", "-f", DOCKER_SQL_PATH])


def main() -> int:
    args = parse_args()
    products = fetch_products(args.base_url, args.per_page, args.limit, args.delay)
    if not products:
        print("No products fetched; refusing to write empty import.", file=sys.stderr)
        return 1

    print("Fetching category images...")
    category_images = fetch_category_images(args.base_url)
    print(f"Fetched {len(category_images)} category images.")

    categories, seeded_products = build_seed(products, category_images)
    images_count = sum(len(product.images) for product in seeded_products)
    specs_count = sum(len(product.specs) for product in seeded_products)

    print(
        f"Prepared {len(seeded_products)} products, {len(categories)} categories, "
        f"{images_count} images, {specs_count} specs."
    )

    sql = generate_sql(categories, seeded_products)
    if args.dry_run:
        print("Dry run only; SQL was not written.")
        return 0

    write_sql(args.output, sql)
    print(f"Wrote {args.output}")

    if args.apply:
        apply_to_docker(args.output, args.container, args.db, args.user)
        print("Applied SQL to Docker PostgreSQL.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
