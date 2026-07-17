import { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '../../auth/hooks/useAuth.js';
import { getCart, addItem, removeItem } from '../services/cartService.js';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../notification/index.js';

const CartContext = createContext(null);

// cartId = userId string để identify giỏ hàng trong Redis
function getCartId(user) {
  return user?.userId ? `cart-${user.userId}` : null;
}

export function CartProvider({ children }) {
  const { user } = useAuthContext();
  const cartId = getCartId(user);
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [items, setItems] = useState([]);        // Item[] từ backend
  const [localItems, setLocalItems] = useState([]); // fallback khi chưa login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ref để cancel setState sau khi component unmount
  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    return () => { cancelledRef.current = true; };
  }, []);

  // Load cart từ Redis khi cartId thay đổi
  // Tách logic fetch ra khỏi useCallback để tránh stale closure trong effect
  const fetchCart = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getCart(id);
      const normalized = (Array.isArray(data) ? data : []).map(item => ({
        ...item,
        id: item.productId || item.id,
      }));
      if (!cancelledRef.current) setItems(normalized);
    } catch {
      if (!cancelledRef.current) setItems([]);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []); // không phụ thuộc cartId → stable reference

  // loadCart dùng để reload sau mutation (addToCart, removeFromCart)
  const loadCart = useCallback(() => fetchCart(cartId), [cartId, fetchCart]);

  // Effect chỉ chạy khi cartId thay đổi (không đưa loadCart vào deps)
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      if (cartId) {
        fetchCart(cartId);
      } else {
        setItems([]);
      }
    });
    return () => { active = false; };
  }, [cartId, fetchCart]);

  // Thêm sản phẩm vào giỏ
  const addToCart = useCallback(async (product, quantity = 1) => {
    // Kiểm tra số lượng tồn kho trước khi thêm
    const activeItemsList = cartId ? items : localItems;
    const existingItem = activeItemsList.find(i => (i.productId || i.id || i.product?.id) === product.id);
    const currentQty = existingItem ? (existingItem.quantity || 0) : 0;
    const requestedQty = currentQty + quantity;

    const stockMax = product.availability ?? product.product?.availability;
    if (stockMax !== undefined && stockMax !== null && requestedQty > stockMax) {
      showToast(`Không thể thêm. Chỉ còn ${stockMax} sản phẩm trong kho.`, 'error');
      return;
    }

    if (cartId) {
      try {
        await addItem(cartId, product.id, quantity);
        await fetchCart(cartId); // reload từ server
        showToast(t('cart.added'), 'success');
      } catch (err) {
        setError(err.message);
        showToast(err.message || 'Lỗi thêm vào giỏ hàng', 'error');
      }
    } else {
      // Chưa login: lưu local
      setLocalItems(prev => {
        const existing = prev.find(i => i.id === product.id);
        return existing
          ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
          : [...prev, { ...product, quantity }];
      });
      showToast(t('cart.added'), 'success');
    }
  }, [cartId, items, localItems, fetchCart, showToast, t]);

  // Xóa sản phẩm
  const removeFromCart = useCallback(async (productId) => {
    // Cập nhật giao diện lập tức (optimistic update)
    setItems(prev => prev.filter(i => (i.productId || i.id) !== productId));
    if (cartId) {
      try {
        await removeItem(cartId, productId);
        await fetchCart(cartId);
      } catch (err) {
        setError(err.message);
        // Khôi phục lại từ server nếu lỗi
        await fetchCart(cartId);
      }
    } else {
      setLocalItems(prev => prev.filter(i => i.id !== productId));
    }
  }, [cartId, fetchCart]);

  // Cập nhật số lượng
  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    // Kiểm tra số lượng tồn kho trước khi cập nhật
    const activeItemsList = cartId ? items : localItems;
    const existingItem = activeItemsList.find(i => (i.productId || i.id || i.product?.id) === productId);
    const stockMax = existingItem?.product?.availability ?? existingItem?.availability ?? existingItem?.productAvailability;
    if (stockMax !== undefined && stockMax !== null && quantity > stockMax) {
      showToast(`Không thể cập nhật. Chỉ còn ${stockMax} sản phẩm trong kho.`, 'error');
      return;
    }

    // Cập nhật giao diện lập tức (optimistic update)
    setItems(prev => prev.map(i => (i.productId || i.id) === productId ? { ...i, quantity } : i));
    if (cartId) {
      try {
        await addItem(cartId, productId, quantity);
        await fetchCart(cartId);
      } catch (err) {
        setError(err.message);
        // Khôi phục lại từ server nếu lỗi
        await fetchCart(cartId);
      }
    } else {
      setLocalItems(prev =>
        prev.map(i => i.id === productId ? { ...i, quantity } : i)
      );
    }
  }, [cartId, items, localItems, fetchCart, removeFromCart, showToast]);


  const clearCart = useCallback(() => {
    setItems([]);
    setLocalItems([]);
  }, []);

  const activeItems = cartId ? items : localItems;
  const totalItems = activeItems.reduce((s, i) => s + (i.quantity || 1), 0);
  const totalPrice = activeItems.reduce(
    (s, i) => s + Number(i.productPrice || i.price || 0) * (i.quantity || 1),
    0
  );

  return (
    <CartContext.Provider value={{
      items: activeItems, cartId, loading, error,
      addToCart, removeFromCart, updateQuantity, clearCart, loadCart,
      totalItems, totalPrice, cartTotal: totalPrice,
    }}>


      {children}
    </CartContext.Provider>
  );
}

export default CartContext;
