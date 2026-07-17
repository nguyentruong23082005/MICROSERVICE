import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../features/products/services/productService.js';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import { useCart } from '../features/cart/hooks/useCart.js';
import { useWishlist } from '../features/wishlist/hooks/useWishlist.js';
import { useCompare } from '../features/compare/index.js';
import { ProductReviews } from '../features/reviews/index.js';
import { money } from '../utils/formatters.js';
import {
  translateCategory,
  translateColor,
  translateMaterial,
} from '../utils/uiText.js';
import { HeartIcon, RefreshIcon } from '../components/icons/index.js';

/* ========== Lightbox Component ========== */
function ImageLightbox({ src, alt, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState({ x: 0, y: 0 });

  const zoomIn = () => setZoom(z => Math.min(z + 0.5, 4));
  const zoomOut = () => { setZoom(z => Math.max(z - 0.5, 0.5)); setPos({ x: 0, y: 0 }); };
  const resetZoom = () => { setZoom(1); setPos({ x: 0, y: 0 }); };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setDragging(true);
    setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPos({ x: e.clientX - start.x, y: e.clientY - start.y });
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        style={{
          position: 'absolute', top: '24px', right: '24px',
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
          width: '44px', height: '44px', color: 'white', fontSize: '1.4rem',
          cursor: 'pointer', display: 'grid', placeItems: 'center',
          backdropFilter: 'blur(4px)',
        }}
        aria-label="Đóng"
      >
        ✕
      </button>

      {/* Zoom controls */}
      <div style={{
        position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '8px', alignItems: 'center',
        background: 'rgba(0,0,0,0.6)', borderRadius: '24px', padding: '6px 12px',
        backdropFilter: 'blur(8px)',
      }}>
        <button type="button" onClick={zoomOut} style={controlBtnStyle} aria-label="Thu nhỏ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button type="button" onClick={resetZoom} style={{ ...controlBtnStyle, fontSize: '0.75rem', color: 'white', width: '48px' }}>
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={zoomIn} style={controlBtnStyle} aria-label="Phóng to">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
      </div>

      {/* Image */}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        draggable={false}
        onMouseDown={handleMouseDown}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          objectFit: 'contain',
          transform: `scale(${zoom}) translate(${pos.x / zoom}px, ${pos.y / zoom}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
          userSelect: 'none',
        }}
      />
    </div>
  );
}

const controlBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  width: '36px', height: '36px', display: 'grid', placeItems: 'center',
  borderRadius: '50%', transition: 'background 0.15s',
};

/* ========== Product Detail Content ========== */
function ProductDetailContent({ product, navigate }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, pendingProductId, toggleWishlist } = useWishlist();
  const { isCompared, toggleCompare } = useCompare();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [openAccordion, setOpenAccordion] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const gallery = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    if (product.imageUrl) {
      return [{ imageUrl: product.imageUrl, altText: product.productName, primaryImage: true }];
    }
    return [];
  }, [product]);

  // Colors list
  const colorsList = useMemo(() => {
    return product.color
      ? product.color.split(/[,;]+/).map(c => c.trim()).filter(Boolean)
      : [];
  }, [product]);

  // Materials list
  const materialsList = useMemo(() => {
    return product.material
      ? product.material.split(/[,;]+/).map(m => m.trim()).filter(Boolean)
      : [];
  }, [product]);

  const activeColor = selectedColor || colorsList[0] || '';
  const activeMaterial = selectedMaterial || materialsList[0] || '';
  const activeImg = activeImage || gallery.find(image => image.primaryImage)?.imageUrl || gallery[0]?.imageUrl || product.imageUrl || '';

  const saved = isWishlisted(product.id);
  const wishlistBusy = pendingProductId === Number(product.id);
  const compared = isCompared(product.id);
  const specificationRows = Array.isArray(product.specifications) ? product.specifications : [];
  const categoryLabel = product.categoryRef?.name || translateCategory(product.category, 'Nội thất');

  const handleAdd = () => {
    setAdding(true);
    addToCart(product, quantity);
    setTimeout(() => {
      setAdding(false);
    }, 600);
  };

  const handleWishlist = async () => {
    if (!user) {
      window.alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích.');
      return;
    }
    try {
      await toggleWishlist(product);
    } catch (err) {
      window.alert(err.message || 'Không thể cập nhật danh sách yêu thích.');
    }
  };

  const handleCompare = () => {
    const result = toggleCompare(product);
    if (!result.ok && result.reason === 'limit') {
      window.alert('Bạn chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc.');
    }
  };

  return (
    <div className="shell" style={{ marginTop: '32px', marginBottom: '80px' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '32px' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Trang chủ</span>
        <span>&gt;</span>
        {product.categoryRef?.parent?.name && (
          <>
            <span>{product.categoryRef.parent.name}</span>
            <span>&gt;</span>
          </>
        )}
        <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/catalog?category=${product.category}`)}>{categoryLabel}</span>
        <span>&gt;</span>
        <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{product.productName}</span>
      </div>

      <div className="grid-2" style={{ gap: '48px', alignItems: 'start' }}>
        {/* Left Column: Images */}
        <div>
          <div
            className="card"
            onClick={() => activeImg && setLightboxOpen(true)}
            style={{
              padding: 0, overflow: 'hidden', background: '#f8f8f8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: '520px', borderRadius: '12px', position: 'relative',
              border: '1px solid var(--color-border)', cursor: activeImg ? 'zoom-in' : 'default',
            }}
          >
            {activeImg ? (
              <img
                src={activeImg}
                alt={product.productName}
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ color: 'var(--color-muted)' }}>Chưa có hình ảnh</div>
            )}
            {/* Zoom hint overlay */}
            {activeImg && (
              <div style={{
                position: 'absolute', bottom: '12px', right: '12px',
                background: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: 'white', fontSize: '0.75rem', pointerEvents: 'none',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                Nhấn để phóng to
              </div>
            )}
          </div>

          {gallery.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginTop: '20px' }}>
              {gallery.slice(0, 4).map((image, index) => {
                const isActive = activeImg === image.imageUrl;
                return (
                  <button
                    key={image.id || image.imageUrl || index}
                    type="button"
                    onClick={() => setActiveImage(image.imageUrl)}
                    style={{
                      aspectRatio: '1',
                      overflow: 'hidden',
                      borderRadius: '8px',
                      background: '#f8f8f8',
                      border: isActive ? '2px solid var(--color-text)' : '1px solid var(--color-border)',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.altText || product.productName}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Info */}
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>{categoryLabel}</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', marginBottom: '16px', fontWeight: 400, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>{product.productName}</h1>
          
          <div style={{ fontSize: '1.8rem', fontWeight: 500, marginBottom: '24px', fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>{money(product.price)}</div>

          <p style={{ color: 'var(--color-muted)', marginBottom: '32px', fontSize: '0.95rem', lineHeight: 1.7 }}>
            {product.discription || product.description || 'Thiết kế tinh tế mang tính thẩm mỹ cao giúp tối ưu hóa công năng và mang lại sự sang trọng cho không gian sống của bạn.'}
          </p>

          {/* Color Option Selector */}
          {colorsList.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '10px' }}>Màu sắc</span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {colorsList.map(c => {
                  const isSelected = activeColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      style={{
                        padding: '10px 20px',
                        border: isSelected ? '1px solid var(--color-text)' : '1px solid var(--color-border)',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        background: isSelected ? '#f5f5f5' : 'transparent',
                        color: 'var(--color-text)',
                        fontWeight: isSelected ? 500 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {translateColor(c)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Material Option Selector */}
          {materialsList.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '10px' }}>Chất liệu</span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {materialsList.map(m => {
                  const isSelected = activeMaterial === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMaterial(m)}
                      style={{
                        padding: '10px 20px',
                        border: isSelected ? '1px solid var(--color-text)' : '1px solid var(--color-border)',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        background: isSelected ? '#f5f5f5' : 'transparent',
                        color: 'var(--color-text)',
                        fontWeight: isSelected ? 500 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {translateMaterial(m)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2px', background: '#fcfcfc', height: '48px' }}>
              <button className="btn btn-ghost" style={{ padding: '0 16px', fontSize: '1.2rem', color: 'var(--color-text)' }} onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng">-</button>
              <span style={{ width: '32px', textAlign: 'center', fontWeight: 500, color: 'var(--color-text)' }}>{quantity}</span>
              <button className="btn btn-ghost" style={{ padding: '0 16px', fontSize: '1.2rem', color: 'var(--color-text)' }} onClick={() => setQuantity(quantity + 1)} aria-label="Tăng số lượng">+</button>
            </div>

            <button
              className="btn btn-primary"
              style={{
                flex: 1,
                height: '48px',
                fontSize: '0.95rem',
                background: 'var(--color-text)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
              }}
              onClick={handleAdd}
              disabled={adding || product.availability === 0}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              {adding ? 'Đang thêm...' : product.availability > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
            </button>

            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishlistBusy}
              style={{
                width: '48px',
                height: '48px',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                background: saved ? 'rgba(17, 17, 17, 0.06)' : 'transparent',
                color: 'var(--color-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title={saved ? 'Xóa khỏi yêu thích' : 'Lưu yêu thích'}
            >
              <HeartIcon
                size={18}
                color="var(--color-text)"
                fill={saved ? 'var(--color-text)' : 'none'}
                strokeWidth={2}
              />
            </button>

            <button
              type="button"
              onClick={handleCompare}
              style={{
                width: '48px',
                height: '48px',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                background: compared ? 'rgba(17, 17, 17, 0.06)' : 'transparent',
                color: 'var(--color-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title={compared ? 'Xóa khỏi so sánh' : 'So sánh'}
            >
              <RefreshIcon
                size={18}
                color="var(--color-text)"
                strokeWidth={2}
              />
            </button>
          </div>

          {/* Delivery & Warranty Info Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '24px 0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text)' }}><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>Giao hàng</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>miễn phí toàn quốc</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text)' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>Bảo hành</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>24 tháng</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text)' }}><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>Đổi trả</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>30 ngày</div>
              </div>
            </div>
          </div>

          {/* Accordion Component */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              {
                title: 'Thông tin sản phẩm',
                content: (
                  <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
                    {product.dimensions && <div><strong>Kích thước:</strong> {product.dimensions}</div>}
                    {product.material && <div><strong>Chất liệu:</strong> {translateMaterial(product.material)}</div>}
                    {product.warranty && <div><strong>Bảo hành:</strong> {product.warranty}</div>}
                    {specificationRows.map((spec, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: '6px' }}>
                        <span>{spec.specLabel}</span>
                        <strong style={{ color: 'var(--color-text)', fontWeight: 500 }}>{spec.specValue}</strong>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                title: 'Chính sách giao hàng',
                content: 'Chúng tôi hỗ trợ giao hàng miễn phí trên toàn quốc cho mọi sản phẩm nội thất. Thời gian giao hàng dự kiến từ 2 đến 5 ngày làm việc tùy thuộc vào địa chỉ nhận hàng của bạn.'
              },
              {
                title: 'Hướng dẫn bảo quản & sử dụng',
                content: 'Lau chùi bằng khăn mềm khô hoặc ẩm nhẹ. Tránh để sản phẩm ngâm nước lâu hoặc phơi dưới ánh nắng gay gắt trực tiếp. Hạn chế sử dụng hóa chất tẩy rửa mạnh để bảo vệ lớp phủ bề mặt.'
              },
              {
                title: 'Chính sách đổi trả',
                content: 'Áp dụng chính sách 1 đổi 1 hoặc hoàn tiền trong vòng 30 ngày nếu phát hiện lỗi từ nhà sản xuất. Sản phẩm đổi trả yêu cầu còn nguyên vẹn, không bị tác động ngoại lực làm biến dạng.'
              }
            ].map((item, index) => {
              const isOpen = openAccordion === index;
              return (
                <div key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <button
                    type="button"
                    onClick={() => setOpenAccordion(isOpen ? -1 : index)}
                    style={{
                      width: '100%',
                      padding: '16px 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{item.title}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 0 16px 0', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--color-muted)' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ marginTop: '80px' }}>
        <ProductReviews productId={product.id} />
      </div>

      {/* Lightbox */}
      {lightboxOpen && activeImg && (
        <ImageLightbox
          src={activeImg}
          alt={product.productName}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState({
    id: null,
    product: null,
    error: null,
  });

  const isCurrentResource = resource.id === id;
  const product = isCurrentResource ? resource.product : null;
  const error = isCurrentResource ? resource.error : null;
  const loading = !isCurrentResource;

  useEffect(() => {
    let active = true;

    getProductById(id)
      .then((data) => {
        if (!active) return;
        setResource({
          id,
          product: data,
          error: null,
        });
      })
      .catch((err) => {
        if (!active) return;
        setResource({
          id,
          product: null,
          error: err.message,
        });
      });

    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="shell section-padding">
        <div className="loading-spinner" aria-label="Đang tải sản phẩm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell section-padding">
        <div className="empty-state">
          <h2 style={{ marginBottom: '16px' }}>Không thể tải sản phẩm</h2>
          <p>{error}</p>
          <button className="btn btn-outline" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>Về trang chủ</button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return <ProductDetailContent key={product.id} product={product} navigate={navigate} />;
}
