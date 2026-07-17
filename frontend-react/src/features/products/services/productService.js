import { get } from '../../../api/client.js';
import {
  buildProductCatalogQuery,
  normalizeProductPage,
} from '../utils/productCatalog.js';

const PREFIX = '/catalog';

/** GET /api/catalog/products with bounded server-side pagination and filters. */
export const getProductPage = async (options) => {
  const query = buildProductCatalogQuery(options);
  const response = await get(`${PREFIX}/products${query}`);
  return normalizeProductPage(response, options?.size);
};

/** GET /api/catalog/products */
export const getAllProducts = () => get(`${PREFIX}/products`);

/** GET /api/catalog/products?category=X */
export const getProductsByCategory = (category) =>
  get(`${PREFIX}/products?category=${encodeURIComponent(category)}`);

/** GET /api/catalog/products?categorySlug=X */
export const getProductsByCategorySlug = (categorySlug) =>
  get(`${PREFIX}/products?categorySlug=${encodeURIComponent(categorySlug)}`);

/** GET /api/catalog/products/{id} */
export const getProductById = (id) => get(`${PREFIX}/products/${id}`);

/** GET /api/catalog/products?name=X */
export const searchProducts = (name) =>
  get(`${PREFIX}/products?name=${encodeURIComponent(name)}`);

/** GET /api/catalog/categories */
export const getCategories = () => get(`${PREFIX}/categories`);

/** GET /api/catalog/categories/{slug} */
export const getCategoryBySlug = (slug) => get(`${PREFIX}/categories/${encodeURIComponent(slug)}`);
