import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const SOURCE_ROOT = new URL('../', import.meta.url);

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, SOURCE_ROOT), 'utf8'));
}

function flattenKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return nestedValue && typeof nestedValue === 'object'
      ? flattenKeys(nestedValue, path)
      : [path];
  });
}

test('English and Vietnamese locales expose the same translation keys', async () => {
  const [english, vietnamese] = await Promise.all([
    readJson('i18n/en.json'),
    readJson('i18n/vi.json'),
  ]);

  assert.deepEqual(flattenKeys(english).sort(), flattenKeys(vietnamese).sort());
});

test('legacy storefront locale contract contains cart, category, and content copy', async () => {
  const english = await readJson('i18n/en.json');
  const requiredKeys = [
    'cart.title',
    'cart.empty_description',
    'cart.continue_shopping',
    'cart.order_summary',
    'cart.subtotal',
    'cart.shipping_fee',
    'cart.shipping_at_checkout',
    'cart.grand_total',
    'cart.secure_checkout_note',
    'category.title',
    'category.default_title',
    'category.default_description',
    'category.loading',
    'category.load_error',
    'category.empty',
    'category.empty_hint',
    'content.loading',
    'content.not_found',
    'content.not_published',
    'home.hero_title',
    'home.hero_description',
    'home.shop_furniture',
    'home.view_collections',
    'home.product_count',
    'home.free_shipping',
    'home.hero_alt',
    'home.shop_by_room',
    'home.featured_products',
    'home.loading_products',
    'home.load_error',
    'home.empty_products',
    'home.benefits.sustainable_title',
    'home.benefits.sustainable_description',
    'home.benefits.delivery_title',
    'home.benefits.delivery_description',
    'home.benefits.returns_title',
    'home.benefits.returns_description',
    'home.benefits.warranty_title',
    'home.benefits.warranty_description',
    'nav.open_menu',
    'nav.primary_navigation',
    'nav.mobile_navigation',
    'nav.compare_count',
    'nav.cart_count',
    'footer.tagline',
    'footer.shop',
    'footer.living_room',
    'footer.bedroom',
    'footer.dining_room',
    'footer.workspace',
    'footer.support',
    'footer.faq',
    'footer.shipping_returns',
    'footer.care_guide',
    'footer.admin_login',
    'footer.newsletter',
    'footer.newsletter_description',
    'footer.email_placeholder',
    'footer.subscribe',
    'footer.copyright',
    'footer.privacy',
    'footer.terms',
    'product.card_label',
    'product.wishlist_login_required',
    'product.wishlist_update_error',
    'product.compare_limit',
    'product.remove_from_wishlist',
    'product.save_to_wishlist',
    'product.remove_from_compare',
    'product.add_to_compare',
    'product.no_image',
    'cart.close',
    'cart.sidebar_empty',
    'cart.view_collections',
    'cart.view_details',
    'cart.material',
    'cart.decrease_quantity',
    'cart.increase_quantity',
  ];
  const availableKeys = new Set(flattenKeys(english));

  requiredKeys.forEach((key) => assert.ok(availableKeys.has(key), `Missing locale key: ${key}`));
});

test('legacy storefront pages obtain user-facing copy from i18next', async () => {
  const pages = [
    'pages/CartPage.jsx',
    'pages/CategoryPage.jsx',
    'pages/ContentPage.jsx',
    'pages/HomePage.jsx',
    'components/layout/Header.jsx',
    'components/layout/Footer.jsx',
    'features/products/components/ProductCard.jsx',
    'features/cart/components/CartSidebar.jsx',
    'features/cart/components/CartItem.jsx',
  ];
  const sources = await Promise.all(
    pages.map((page) => readFile(new URL(page, SOURCE_ROOT), 'utf8')),
  );

  sources.forEach((source, index) => {
    assert.match(source, /useTranslation\s*\(\s*\)/, `${pages[index]} must use useTranslation()`);
  });
});

test('admin shell locale contract is available in both languages', async () => {
  const [english, vietnamese] = await Promise.all([
    readJson('i18n/en.json'),
    readJson('i18n/vi.json'),
  ]);
  const requiredKeys = [
    'common.previous',
    'common.next',
    'admin.brand',
    'admin.menu_label',
    'admin.overview',
    'admin.products',
    'admin.categories',
    'admin.inventory',
    'admin.orders',
    'admin.customers',
    'admin.payment_transactions',
    'admin.transactions',
    'admin.notifications',
    'admin.coupons',
    'admin.reviews',
    'admin.content',
    'admin.administrator',
  ];
  const englishKeys = new Set(flattenKeys(english));
  const vietnameseKeys = new Set(flattenKeys(vietnamese));

  requiredKeys.forEach((key) => {
    assert.equal(englishKeys.has(key), true, `Missing English key: ${key}`);
    assert.equal(vietnameseKeys.has(key), true, `Missing Vietnamese key: ${key}`);
  });
});

test('shared admin components obtain user-facing copy from i18next', async () => {
  const components = [
    'features/admin/components/AdminHeader.jsx',
    'features/admin/components/AdminSidebar.jsx',
    'features/admin/components/Pagination.jsx',
  ];
  const sources = await Promise.all(
    components.map((component) => readFile(new URL(component, SOURCE_ROOT), 'utf8')),
  );

  sources.forEach((source, index) => {
    assert.match(source, /useTranslation\s*\(\s*\)/, `${components[index]} must use useTranslation()`);
  });
});

test('admin payments locale contract is available in both languages', async () => {
  const [english, vietnamese] = await Promise.all([
    readJson('i18n/en.json'),
    readJson('i18n/vi.json'),
  ]);
  const requiredKeys = [
    'admin.payments.title',
    'admin.payments.description',
    'admin.payments.total_revenue',
    'admin.payments.total_transactions',
    'admin.payments.successful',
    'admin.payments.transaction_id',
    'admin.payments.order_id',
    'admin.payments.customer_id',
    'admin.payments.status',
    'admin.payments.amount',
    'admin.payments.payment_date',
    'admin.payments.empty_title',
    'admin.payments.empty_description',
  ];
  const englishKeys = new Set(flattenKeys(english));
  const vietnameseKeys = new Set(flattenKeys(vietnamese));

  requiredKeys.forEach((key) => {
    assert.equal(englishKeys.has(key), true, `Missing English key: ${key}`);
    assert.equal(vietnameseKeys.has(key), true, `Missing Vietnamese key: ${key}`);
  });
});

test('admin payments page obtains user-facing copy from i18next', async () => {
  const source = await readFile(
    new URL('features/admin/pages/Payments.jsx', SOURCE_ROOT),
    'utf8',
  );

  assert.match(source, /useTranslation\s*\(\s*\)/, 'Payments.jsx must use useTranslation()');
});

test('admin reviews locale contract is available in both languages', async () => {
  const [english, vietnamese] = await Promise.all([
    readJson('i18n/en.json'),
    readJson('i18n/vi.json'),
  ]);
  const requiredKeys = [
    'admin.review_management.title',
    'admin.review_management.description',
    'admin.review_management.delete_confirm',
    'admin.review_management.delete_success',
    'admin.review_management.status_success',
    'admin.review_management.total',
    'admin.review_management.average',
    'admin.review_management.product',
    'admin.review_management.customer',
    'admin.review_management.rating',
    'admin.review_management.content',
    'admin.review_management.status',
    'admin.review_management.actions',
    'admin.review_management.deleted_product',
    'admin.review_management.product_id',
    'admin.review_management.customer_fallback',
    'admin.review_management.stars',
    'admin.review_management.no_title',
    'admin.review_management.no_comment',
    'admin.review_management.show',
    'admin.review_management.hide',
    'admin.review_management.empty_title',
    'admin.review_management.empty_description',
  ];
  const englishKeys = new Set(flattenKeys(english));
  const vietnameseKeys = new Set(flattenKeys(vietnamese));

  requiredKeys.forEach((key) => {
    assert.equal(englishKeys.has(key), true, `Missing English key: ${key}`);
    assert.equal(vietnameseKeys.has(key), true, `Missing Vietnamese key: ${key}`);
  });
});

test('admin reviews page obtains user-facing copy from i18next', async () => {
  const source = await readFile(new URL('features/admin/pages/Reviews.jsx', SOURCE_ROOT), 'utf8');
  assert.match(source, /useTranslation\s*\(\s*\)/, 'Reviews.jsx must use useTranslation()');
});

test('admin inventory locale contract is available in both languages', async () => {
  const [english, vietnamese] = await Promise.all([
    readJson('i18n/en.json'),
    readJson('i18n/vi.json'),
  ]);
  const requiredKeys = [
    'admin.inventory_management.title',
    'admin.inventory_management.description',
    'admin.inventory_management.out_of_stock',
    'admin.inventory_management.low_stock',
    'admin.inventory_management.in_stock',
    'admin.inventory_management.update_success',
    'admin.inventory_management.update_error',
    'admin.inventory_management.product',
    'admin.inventory_management.category',
    'admin.inventory_management.price',
    'admin.inventory_management.stock_level',
    'admin.inventory_management.quantity',
    'admin.inventory_management.actions',
    'admin.inventory_management.sku',
    'admin.inventory_management.uncategorized',
    'admin.inventory_management.save',
    'admin.inventory_management.saving',
    'admin.inventory_management.empty_title',
    'admin.inventory_management.empty_description',
  ];
  const englishKeys = new Set(flattenKeys(english));
  const vietnameseKeys = new Set(flattenKeys(vietnamese));

  requiredKeys.forEach((key) => {
    assert.equal(englishKeys.has(key), true, `Missing English key: ${key}`);
    assert.equal(vietnameseKeys.has(key), true, `Missing Vietnamese key: ${key}`);
  });
});

test('admin inventory page obtains user-facing copy from i18next', async () => {
  const source = await readFile(new URL('features/admin/pages/Inventory.jsx', SOURCE_ROOT), 'utf8');
  assert.match(source, /useTranslation\s*\(\s*\)/, 'Inventory.jsx must use useTranslation()');
});

test('admin orders locale contract is available in both languages', async () => {
  const [english, vietnamese] = await Promise.all([
    readJson('i18n/en.json'),
    readJson('i18n/vi.json'),
  ]);
  const requiredKeys = [
    'admin.order_management.title',
    'admin.order_management.description',
    'admin.order_management.update_error',
    'admin.order_management.pending',
    'admin.order_management.processing',
    'admin.order_management.shipping',
    'admin.order_management.completed',
    'admin.order_management.search_placeholder',
    'admin.order_management.filter_label',
    'admin.order_management.all_statuses',
    'admin.order_management.payment_expected',
    'admin.order_management.paid',
    'admin.order_management.delivered',
    'admin.order_management.cancelled',
    'admin.order_management.order_id',
    'admin.order_management.customer',
    'admin.order_management.products',
    'admin.order_management.payment',
    'admin.order_management.status',
    'admin.order_management.total',
    'admin.order_management.order_date',
    'admin.order_management.actions',
    'admin.order_management.items',
    'admin.order_management.confirm_payment',
    'admin.order_management.ship_order',
    'admin.order_management.update_status',
    'admin.order_management.cancel_order',
    'admin.order_management.empty_title',
    'admin.order_management.empty_description',
  ];
  const englishKeys = new Set(flattenKeys(english));
  const vietnameseKeys = new Set(flattenKeys(vietnamese));

  requiredKeys.forEach((key) => {
    assert.equal(englishKeys.has(key), true, `Missing English key: ${key}`);
    assert.equal(vietnameseKeys.has(key), true, `Missing Vietnamese key: ${key}`);
  });
});

test('admin orders page obtains user-facing copy from i18next', async () => {
  const source = await readFile(new URL('features/admin/pages/Orders.jsx', SOURCE_ROOT), 'utf8');
  assert.match(source, /useTranslation\s*\(\s*\)/, 'Orders.jsx must use useTranslation()');
});

test('admin dashboard locale contract is available in both languages', async () => {
  const [english, vietnamese] = await Promise.all([
    readJson('i18n/en.json'),
    readJson('i18n/vi.json'),
  ]);
  const requiredKeys = [
    'admin.dashboard.title',
    'admin.dashboard.description',
    'admin.dashboard.download_report',
    'admin.dashboard.metric',
    'admin.dashboard.value',
    'admin.dashboard.total_revenue',
    'admin.dashboard.total_orders',
    'admin.dashboard.products',
    'admin.dashboard.customers',
    'admin.dashboard.total_stock',
    'admin.dashboard.low_stock_products',
    'admin.dashboard.order_id',
    'admin.dashboard.order_date',
    'admin.dashboard.status',
    'admin.dashboard.total',
    'admin.dashboard.low_stock',
    'admin.dashboard.low_stock_count',
    'admin.dashboard.orders_by_status',
    'admin.dashboard.pending',
    'admin.dashboard.paid',
    'admin.dashboard.delivered',
    'admin.dashboard.cancelled',
    'admin.dashboard.recent_orders',
    'admin.dashboard.view_all',
    'admin.dashboard.customer',
    'admin.dashboard.no_recent_orders',
    'admin.dashboard.system_notifications',
    'admin.dashboard.no_notifications',
    'admin.dashboard.business_overview',
    'admin.dashboard.revenue_note',
    'admin.dashboard.orders_note',
    'admin.dashboard.categories_note',
    'admin.dashboard.customers_note',
    'admin.dashboard.operations_status',
    'admin.dashboard.needs_attention',
    'admin.dashboard.stable',
    'admin.dashboard.order_total_badge',
    'admin.dashboard.recent_activity',
    'admin.dashboard.recent_sales',
    'admin.dashboard.live_updates',
    'admin.dashboard.live',
  ];
  const englishKeys = new Set(flattenKeys(english));
  const vietnameseKeys = new Set(flattenKeys(vietnamese));

  requiredKeys.forEach((key) => {
    assert.equal(englishKeys.has(key), true, `Missing English key: ${key}`);
    assert.equal(vietnameseKeys.has(key), true, `Missing Vietnamese key: ${key}`);
  });
});

test('admin dashboard obtains user-facing and report copy from i18next', async () => {
  const source = await readFile(new URL('features/admin/pages/Dashboard.jsx', SOURCE_ROOT), 'utf8');
  assert.match(source, /useTranslation\s*\(\s*\)/, 'Dashboard.jsx must use useTranslation()');
});

test('admin categories locale contract is available in both languages', async () => {
  const [english, vietnamese] = await Promise.all([readJson('i18n/en.json'), readJson('i18n/vi.json')]);
  const requiredKeys = [
    'admin.category_management.title', 'admin.category_management.description',
    'admin.category_management.load_error', 'admin.category_management.uploading',
    'admin.category_management.upload_success', 'admin.category_management.upload_error',
    'admin.category_management.update_success', 'admin.category_management.create_success',
    'admin.category_management.save_error', 'admin.category_management.delete_confirm',
    'admin.category_management.delete_success', 'admin.category_management.delete_error',
    'admin.category_management.close', 'admin.category_management.add_category',
    'admin.category_management.edit_category', 'admin.category_management.new_category',
    'admin.category_management.name', 'admin.category_management.name_placeholder',
    'admin.category_management.slug', 'admin.category_management.description_label',
    'admin.category_management.description_placeholder', 'admin.category_management.image_url',
    'admin.category_management.upload_image', 'admin.category_management.display_order',
    'admin.category_management.show_on_store', 'admin.category_management.cancel',
    'admin.category_management.saving', 'admin.category_management.save_category',
    'admin.category_management.image', 'admin.category_management.status',
    'admin.category_management.actions', 'admin.category_management.visible',
    'admin.category_management.hidden', 'admin.category_management.details',
    'admin.category_management.edit', 'admin.category_management.delete',
    'admin.category_management.empty_title',
    'admin.category_management.empty_description',
  ];
  const englishKeys = new Set(flattenKeys(english));
  const vietnameseKeys = new Set(flattenKeys(vietnamese));
  requiredKeys.forEach((key) => {
    assert.equal(englishKeys.has(key), true, `Missing English key: ${key}`);
    assert.equal(vietnameseKeys.has(key), true, `Missing Vietnamese key: ${key}`);
  });
});

test('admin categories page obtains user-facing copy from i18next', async () => {
  const source = await readFile(new URL('features/admin/pages/Categories.jsx', SOURCE_ROOT), 'utf8');
  assert.match(source, /useTranslation\s*\(\s*\)/, 'Categories.jsx must use useTranslation()');
});
