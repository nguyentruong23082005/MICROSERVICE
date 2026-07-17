const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 100;

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }
}

export function buildProductCatalogQuery({
  page = 1,
  size = DEFAULT_PAGE_SIZE,
  name = '',
  category = '',
  inStock,
  minPrice,
  maxPrice,
} = {}) {
  requirePositiveInteger(page, 'page');
  requirePositiveInteger(size, 'size');
  if (size > MAX_PAGE_SIZE) {
    throw new RangeError(`size must be between 1 and ${MAX_PAGE_SIZE}.`);
  }

  const params = new URLSearchParams({
    page: String(page - 1),
    size: String(size),
  });
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedCategory = typeof category === 'string' ? category.trim() : '';

  if (normalizedName) params.set('name', normalizedName);
  if (normalizedCategory) params.set('category', normalizedCategory);
  if (typeof inStock === 'boolean') params.set('inStock', String(inStock));
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') params.set('minPrice', String(minPrice));
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') params.set('maxPrice', String(maxPrice));

  return `?${params.toString()}`;
}

export function normalizeProductPage(response, fallbackSize = DEFAULT_PAGE_SIZE) {
  if (Array.isArray(response)) {
    return {
      items: [...response],
      page: 1,
      pageSize: response.length || fallbackSize,
      totalItems: response.length,
      totalPages: response.length > 0 ? 1 : 0,
    };
  }

  const content = Array.isArray(response?.content) ? response.content : [];
  return {
    items: [...content],
    page: Number.isInteger(response?.number) ? response.number + 1 : 1,
    pageSize: Number.isInteger(response?.size) ? response.size : fallbackSize,
    totalItems: Number.isFinite(response?.totalElements) ? response.totalElements : content.length,
    totalPages: Number.isInteger(response?.totalPages) ? response.totalPages : (content.length ? 1 : 0),
  };
}
