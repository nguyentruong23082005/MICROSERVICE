export function getPageAfterProductDeletion({ currentPage, itemCount }) {
  const safePage = Number.isInteger(currentPage) && currentPage > 0 ? currentPage : 1;
  const safeItemCount = Number.isInteger(itemCount) && itemCount > 0 ? itemCount : 0;

  return safeItemCount === 1 && safePage > 1 ? safePage - 1 : safePage;
}