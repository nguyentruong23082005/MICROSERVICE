import React from 'react';
import BauhausHeader from '../components/BauhausHeader.jsx';
import CartSidebar from '../components/CartSidebar.jsx';
import BauhausFooter from '../components/BauhausFooter.jsx';

const ClientLayout = ({ children }) => {
  return (
    <div className="client-layout">
      <BauhausHeader />
      <main className="client-main">{children}</main>
      <BauhausFooter />
      <CartSidebar />
    </div>
  );
};

export default ClientLayout;
