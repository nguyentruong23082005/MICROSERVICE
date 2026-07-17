import { useContext } from 'react';
import CartContext from '../contexts/CartContext.jsx';

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be inside CartProvider');
  return ctx;
}

export const useCart = () => useCartContext();
export default useCart;
