import { useContext } from 'react';
import CompareContext from '../contexts/CompareContext.jsx';

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used inside CompareProvider');
  }
  return context;
}

export default useCompare;
