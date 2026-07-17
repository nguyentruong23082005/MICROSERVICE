import Header from './Header.jsx';
import CartSidebar from '../../features/cart/components/CartSidebar.jsx';
import Footer from './Footer.jsx';
import AIChatbot from '../ui/AIChatbot.jsx';
import SupportChatWidget from '../ui/SupportChatWidget.jsx';

const ClientLayout = ({ children }) => {
  return (
    <div className="client-layout">
      {/* Announcement Bar */}
      <div style={{ background: '#FAF8F5', borderBottom: '1px solid var(--color-border)', fontSize: '0.8rem', padding: '10px 0', color: 'var(--color-text-muted)' }}>
        <div className="shell" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-gift" style={{ fontSize: '1rem', color: '#8c7853' }}></i>
            <span>Miễn phí giao hàng toàn quốc cho đơn từ 2.000.000đ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-arrow-counterclockwise" style={{ fontSize: '1rem', color: '#8c7853' }}></i>
            <span>30 ngày đổi trả dễ dàng</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-shield-check" style={{ fontSize: '1rem', color: '#8c7853' }}></i>
            <span>Bảo hành lên đến 3 năm</span>
          </div>
        </div>
      </div>
      <Header />
      <main className="client-main">{children}</main>
      <Footer />
      <CartSidebar />
      <SupportChatWidget />
      <AIChatbot />
    </div>
  );
};

export default ClientLayout;
