import { createContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage.js';

const CompareContext = createContext(null);
const MAX_COMPARE_ITEMS = 4;
const COMPARE_IDS_KEY = 'ecommerce_compare_product_ids';

function productIdFrom(value) {
  const id = typeof value === 'object' ? value?.id : value;
  const numericId = Number(id);
  return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
}

function normalizeIds(values) {
  const source = Array.isArray(values) ? values : [];
  const seen = new Set();
  const ids = [];
  source.forEach((value) => {
    const id = productIdFrom(value);
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  });
  return ids.slice(0, MAX_COMPARE_ITEMS);
}

export function CompareProvider({ children }) {
  const [storedIds, setStoredIds] = useLocalStorage(COMPARE_IDS_KEY, []);

  const productIds = useMemo(
    () => normalizeIds(storedIds),
    [storedIds]
  );

  const isCompared = useCallback(
    (productId) => productIds.includes(Number(productId)),
    [productIds]
  );

  const addToCompare = useCallback((productOrId) => {
    const id = productIdFrom(productOrId);
    if (!id) return { ok: false, reason: 'invalid' };

    let result = { ok: true };
    setStoredIds((current) => {
      const currentIds = normalizeIds(current);
      if (currentIds.includes(id)) {
        result = { ok: true, duplicate: true };
        return currentIds;
      }
      if (currentIds.length >= MAX_COMPARE_ITEMS) {
        result = { ok: false, reason: 'limit' };
        return currentIds;
      }
      return [...currentIds, id];
    });
    return result;
  }, [setStoredIds]);

  const removeFromCompare = useCallback((productId) => {
    const id = productIdFrom(productId);
    if (!id) return;
    setStoredIds((current) => normalizeIds(current).filter((currentId) => currentId !== id));
  }, [setStoredIds]);

  const toggleCompare = useCallback((productOrId) => {
    const id = productIdFrom(productOrId);
    if (!id) return { ok: false, reason: 'invalid' };
    if (isCompared(id)) {
      removeFromCompare(id);
      return { ok: true, removed: true };
    }
    return addToCompare(id);
  }, [addToCompare, isCompared, removeFromCompare]);

  const clearCompare = useCallback(() => setStoredIds([]), [setStoredIds]);

  const value = useMemo(() => ({
    productIds,
    items: productIds,
    count: productIds.length,
    maxItems: MAX_COMPARE_ITEMS,
    isCompared,
    addToCompare,
    removeFromCompare,
    toggleCompare,
    clearCompare,
  }), [addToCompare, clearCompare, isCompared, productIds, removeFromCompare, toggleCompare]);

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

export default CompareContext;
