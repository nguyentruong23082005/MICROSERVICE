import { useContext } from 'react';
import WishlistContext from '../contexts/WishlistContext.jsx';

export function useWishlistContext() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlistContext must be inside WishlistProvider');
  return ctx;
}

export const useWishlist = () => useWishlistContext();
export default useWishlist;
