export function paginateItems(source, requestedPage = 1, requestedPageSize = 10) {
  const items = Array.isArray(source) ? source : [];
  const parsedSize = Number.parseInt(requestedPageSize, 10);
  const pageSize = Number.isInteger(parsedSize) && parsedSize > 0 ? parsedSize : 10;
  const totalItems = items.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const parsedPage = Number.parseInt(requestedPage, 10);
  const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const page = totalPages === 0 ? 1 : Math.min(safePage, totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}
