import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../../auth/hooks/useAuth.js';
import { addWishlistItem, getWishlist, removeWishlistItem } from '../services/wishlistService.js';

const WishlistContext = createContext(null);

function normalizeProductId(productId) {
  const value = Number(productId);
  return Number.isNaN(value) ? productId : value;
}

function sameProductId(left, right) {
  return normalizeProductId(left) === normalizeProductId(right);
}

function upsertWishlistItem(items, item) {
  const productId = item?.product?.id;
  if (!productId) return items;
  const exists = items.some(existing => sameProductId(existing?.product?.id, productId));
  return exists
    ? items.map(existing => sameProductId(existing?.product?.id, productId) ? item : existing)
    : [item, ...items];
}

export function WishlistProvider({ children }) {
  const { user } = useAuthContext();
  const userId = user?.userId || user?.id;
  const [state, setState] = useState({
    userId: null,
    items: [],
    loading: false,
    error: null,
  });
  const [pendingProductId, setPendingProductId] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        if (!userId) {
          setState({ userId: null, items: [], loading: false, error: null });
          return null;
        }
        setState(previous => ({
          ...previous,
          userId,
          loading: true,
          error: null,
        }));
        return getWishlist(userId);
      })
      .then((data) => {
        if (!active || !userId || data === null) return;
        setState({
          userId,
          items: Array.isArray(data) ? data : [],
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!active || !userId) return;
        setState({
          userId,
          items: [],
          loading: false,
          error: err.message,
        });
      });

    return () => { active = false; };
  }, [userId]);

  const productIds = useMemo(
    () => new Set(state.items.map(item => normalizeProductId(item?.product?.id)).filter(Boolean)),
    [state.items]
  );

  const isWishlisted = useCallback(
    (productId) => productIds.has(normalizeProductId(productId)),
    [productIds]
  );

  const addToWishlist = useCallback(async (product) => {
    if (!userId) {
      const error = new Error('Vui lòng đăng nhập để lưu sản phẩm yêu thích.');
      error.status = 401;
      throw error;
    }
    if (!product?.id) return null;

    const productId = normalizeProductId(product.id);
    setPendingProductId(productId);
    try {
      const item = await addWishlistItem(userId, product.id);
      setState(previous => ({
        ...previous,
        userId,
        items: upsertWishlistItem(previous.items, item),
        error: null,
      }));
      return item;
    } finally {
      setPendingProductId(null);
    }
  }, [userId]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!userId || !productId) return;

    const normalizedProductId = normalizeProductId(productId);
    setPendingProductId(normalizedProductId);
    try {
      await removeWishlistItem(userId, productId);
      setState(previous => ({
        ...previous,
        items: previous.items.filter(item => !sameProductId(item?.product?.id, productId)),
        error: null,
      }));
    } finally {
      setPendingProductId(null);
    }
  }, [userId]);

  const toggleWishlist = useCallback(async (product) => {
    if (isWishlisted(product?.id)) {
      await removeFromWishlist(product.id);
      return false;
    }
    await addToWishlist(product);
    return true;
  }, [addToWishlist, isWishlisted, removeFromWishlist]);

  const value = useMemo(() => ({
    items: state.items,
    loading: state.loading,
    error: state.error,
    pendingProductId,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  }), [
    addToWishlist,
    isWishlisted,
    pendingProductId,
    removeFromWishlist,
    state.error,
    state.items,
    state.loading,
    toggleWishlist,
  ]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export default WishlistContext;
