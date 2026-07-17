import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import { getUserProfile } from '../features/auth/services/authService.js';
import { getUserOrders, cancelOrder, getShippingProvinces, getShippingDistricts, getShippingWards } from '../features/orders/services/orderService.js';
import { useWishlist } from '../features/wishlist/hooks/useWishlist.js';
import { deleteAddress, getAddresses, setDefaultAddress, createAddress } from '../features/addresses/index.js';
import {
  orderDateLabel,
  orderDisplayId,
  orderItemsCount,
  orderStatus,
  orderTotal,
} from '../features/orders/utils/orderViewModel.js';
import { initials, money } from '../utils/formatters.js';
import { translateCategory, translateStatus } from '../utils/uiText.js';
import { ShoppingCartIcon } from '../components/icons/index.js';

function statusColor(status) {
  if (status === 'DELIVERED' || status === 'COMPLETED' || status === 'PAID') return 'var(--color-olive)';
  if (status === 'CANCELLED' || status === 'FAILED' || status === 'PAYMENT_FAILED') return '#B85042';
  return 'var(--color-wood)';
}

function productInfo(item = {}) {
  return item.product || item;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const {
    items: wishlistItems,
    loading: loadingWishlist,
    error: wishlistError,
    removeFromWishlist,
  } = useWishlist();
  const navigate = useNavigate();
  const userId = user?.userId || user?.id;

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressReloadKey, setAddressReloadKey] = useState(0);

  // Address creation form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);
  const [formError, setFormError] = useState('');

  const [profile, setProfile] = useState(null);

  // Tải profile của khách hàng khi load trang
  useEffect(() => {
    if (!userId) return;
    let active = true;
    getUserProfile(userId)
      .then(data => {
        if (active && data) {
          setProfile(data);
        }
      })
      .catch(err => console.error('Failed to load user profile in ProfilePage:', err));
    return () => { active = false; };
  }, [userId]);

  // Điền sẵn thông tin cá nhân vào form khi mở form thêm địa chỉ
  useEffect(() => {
    if (!showAddressForm || !profile) return;
    setRecipientName(
      [profile.userDetails?.firstName, profile.userDetails?.lastName]
        .filter(Boolean)
        .join(' ') || profile.userName || ''
    );
    setPhone(profile.userDetails?.phoneNumber || '');
    setEmail(profile.userDetails?.email || '');
  }, [showAddressForm, profile]);

  // Fetch provinces when form is shown
  useEffect(() => {
    if (!showAddressForm) return;
    let active = true;
    getShippingProvinces()
      .then(data => {
        if (active && data) setProvinces(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to load provinces:', err));
    return () => { active = false; };
  }, [showAddressForm]);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvinceId) return;
    let active = true;
    getShippingDistricts(selectedProvinceId)
      .then(data => {
        if (active && data) {
          setDistricts(Array.isArray(data) ? data : []);
        }
      })
      .catch(err => console.error('Failed to load districts:', err));
    return () => { active = false; };
  }, [selectedProvinceId]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrictId) return;
    let active = true;
    getShippingWards(selectedDistrictId)
      .then(data => {
        if (active && data) setWards(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to load wards:', err));
    return () => { active = false; };
  }, [selectedDistrictId]);

  const handleProvinceChange = (e) => {
    const val = e.target.value;
    setSelectedProvinceId(val);
    setSelectedDistrictId('');
    setSelectedWardCode('');
    setDistricts([]);
    setWards([]);
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setSelectedDistrictId(val);
    setSelectedWardCode('');
    setWards([]);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!recipientName.trim() || !phone.trim() || !addressLine.trim() || !selectedProvinceId || !selectedDistrictId || !selectedWardCode) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    setSubmittingAddress(true);
    setFormError('');
    try {
      const p = provinces.find(x => String(x.id) === String(selectedProvinceId));
      const d = districts.find(x => String(x.id) === String(selectedDistrictId));
      const w = wards.find(x => String(x.code) === String(selectedWardCode));

      await createAddress(userId, {
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        addressLine: addressLine.trim(),
        city: p?.name || '',
        provinceId: Number(selectedProvinceId),
        provinceName: p?.name || '',
        districtId: Number(selectedDistrictId),
        districtName: d?.name || '',
        wardCode: selectedWardCode,
        wardName: w?.name || '',
        defaultAddress: isDefaultAddress || addresses.length === 0,
      });

      // Reset form and reload
      setShowAddressForm(false);
      setRecipientName('');
      setPhone('');
      setEmail('');
      setAddressLine('');
      setSelectedProvinceId('');
      setSelectedDistrictId('');
      setSelectedWardCode('');
      setIsDefaultAddress(false);
      setAddressReloadKey(prev => prev + 1);
    } catch (err) {
      setFormError(err.message || 'Không thể lưu địa chỉ.');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses' | 'wishlist'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!userId) return;
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoadingOrders(true);
        setOrdersError('');
        return getUserOrders(userId);
      })
      .then((data) => {
        if (active && data) setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setOrdersError(err.message || 'Không thể tải lịch sử đơn hàng.');
      })
      .finally(() => {
        if (active) setLoadingOrders(false);
      });

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoadingAddresses(true);
        setAddressError('');
        return getAddresses(userId);
      })
      .then((data) => {
        if (active && data) setAddresses(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setAddressError(err.message || 'Không thể tải địa chỉ đã lưu.');
      })
      .finally(() => {
        if (active) setLoadingAddresses(false);
      });

    return () => { active = false; };
  }, [userId, addressReloadKey]);

  const NON_CANCELLABLE = new Set(['DELIVERED', 'CANCELLED', 'COMPLETED']);

  const ORDER_FILTERS = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ thanh toán' },
    { key: 'PROCESSING', label: 'Đang xử lý' },
    { key: 'SHIPPING', label: 'Đang giao' },
    { key: 'COMPLETED', label: 'Hoàn tất' },
    { key: 'CANCELLED', label: 'Đã hủy' }
  ];

  const getFilteredOrders = () => {
    if (selectedStatusFilter === 'ALL') return orders;
    return orders.filter(order => {
      const status = (order.status || '').toUpperCase();
      if (selectedStatusFilter === 'PENDING') {
        return status === 'PENDING' || status === 'PAYMENT_EXPECTED';
      }
      if (selectedStatusFilter === 'PROCESSING') {
        return status === 'PROCESSING' || status === 'ORDER_PLACED' || status === 'PAID' || status === 'APPROVED' || status === 'PROCESSED';
      }
      if (selectedStatusFilter === 'SHIPPING') {
        return status === 'SHIPPING' || status === 'SHIPPED' || status === 'SENT';
      }
      if (selectedStatusFilter === 'COMPLETED') {
        return status === 'COMPLETED' || status === 'DELIVERED';
      }
      if (selectedStatusFilter === 'CANCELLED') {
        return status === 'CANCELLED' || status === 'CANCELED' || status === 'FAILED' || status === 'PAYMENT_FAILED';
      }
      return true;
    });
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn huỷ đơn hàng này không?')) return;
    setCancellingId(orderId);
    setCancelError('');
    try {
      await cancelOrder(orderId);
      setReloadKey((v) => v + 1);
    } catch (err) {
      setCancelError(err.message || 'Không thể huỷ đơn hàng. Vui lòng thử lại.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRemoveWishlist = async (productId) => {
    try {
      await removeFromWishlist(productId);
    } catch (err) {
      window.alert(err.message || 'Không thể xoá sản phẩm yêu thích.');
    }
  };

  const handleDefaultAddress = async (addressId) => {
    try {
      await setDefaultAddress(userId, addressId);
      setAddressReloadKey((value) => value + 1);
    } catch (err) {
      window.alert(err.message || 'Không thể đặt địa chỉ mặc định.');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(userId, addressId);
      setAddressReloadKey((value) => value + 1);
    } catch (err) {
      window.alert(err.message || 'Không thể xoá địa chỉ.');
    }
  };

  if (!user) {
    return (
      <div className="shell section-padding" style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Vui lòng đăng nhập để xem tài khoản.</h2>
        <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>Về trang chủ</button>
      </div>
    );
  }

  const renderOrders = () => {
    if (loadingOrders) {
      return (
        <div className="empty-state" style={{ padding: '48px 24px', borderRadius: 'var(--radius-md)' }} aria-busy="true">
          <p className="muted">Đang tải lịch sử đơn hàng...</p>
        </div>
      );
    }

    if (ordersError) {
      return (
        <div className="empty-state" style={{ padding: '48px 24px', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Chưa tải được đơn hàng</h3>
          <p className="muted" style={{ marginBottom: '24px' }}>{ordersError}</p>
          <button className="btn btn-outline" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</button>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '48px 24px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--color-bg-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--color-border)' }}>
            <ShoppingCartIcon size={24} color="var(--color-muted)" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Chưa có đơn hàng</h3>
          <p className="muted" style={{ marginBottom: '24px', fontSize: '0.92rem' }}>Khi bạn đặt hàng, thông tin đơn hàng sẽ hiển thị tại đây.</p>
          <button className="btn btn-outline" onClick={() => navigate('/')}>Bắt đầu mua sắm</button>
        </div>
      );
    }

    const filtered = getFilteredOrders();

    if (filtered.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '48px 24px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <p className="muted" style={{ fontSize: '0.92rem' }}>Không có đơn hàng nào thuộc phân loại này.</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {cancelError && (
          <p role="alert" style={{ color: '#B85042', fontSize: '0.92rem', marginBottom: '8px' }}>
            {cancelError}
          </p>
        )}
        {filtered.map((order) => {
          const id = orderDisplayId(order);
          const status = orderStatus(order);
          const items = Array.isArray(order.items) ? order.items : [];
          const shippingLine = [order.shippingAddress, order.shippingCity].filter(Boolean).join(', ');
          const canCancel = !NON_CANCELLABLE.has(status);
          const isCancelling = cancellingId === (order.id ?? id);

          return (
            <article
              key={id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '20px',
                background: 'var(--color-bg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Đơn hàng #{id}</h3>
                  <p className="muted" style={{ fontSize: '0.9rem' }}>{orderDateLabel(order)} · {orderItemsCount(order)} sản phẩm</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: statusColor(status), fontWeight: 600, marginBottom: '6px' }}>
                    {translateStatus(status)}
                  </div>
                  <div style={{ fontWeight: 600 }}>{money(orderTotal(order))}</div>
                </div>
              </div>

              {items.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {items.slice(0, 4).map((item, index) => {
                    const product = productInfo(item);
                    const imageUrl = product.imageUrl || item.productImageUrl || item.imageUrl;
                    return (
                      <div key={`${id}-${product.id || index}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px', flex: '1 1 180px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--color-bg-soft)', overflow: 'hidden', flex: '0 0 auto' }}>
                          {imageUrl && (
                            <img src={imageUrl} alt={product.productName || product.name || 'Sản phẩm'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.92rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {product.productName || product.name || 'Sản phẩm'}
                          </div>
                          <div className="muted" style={{ fontSize: '0.82rem' }}>x{item.quantity || 1}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(order.shippingName || shippingLine || order.shippingPhone) && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {order.shippingName && <div>Người nhận: {order.shippingName}</div>}
                  {order.shippingPhone && <div>Số điện thoại: {order.shippingPhone}</div>}
                  {shippingLine && <div>Giao đến: {shippingLine}</div>}
                </div>
              )}

              {(order.trackingNumber || Array.isArray(order.trackingSteps)) && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', marginTop: '14px' }}>
                  {order.trackingNumber && (
                    <div className="muted" style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
                      Mã vận đơn: <strong style={{ color: 'var(--color-text)' }}>{order.trackingNumber}</strong>
                    </div>
                  )}
                  {Array.isArray(order.trackingSteps) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                      {order.trackingSteps.map((step) => (
                        <div key={step.status} style={{ border: `1px solid ${step.completed ? 'var(--color-olive)' : 'var(--color-border)'}`, borderRadius: '8px', padding: '10px', background: step.current ? 'var(--color-bg-soft)' : 'transparent' }}>
                          <div style={{ fontSize: '0.8rem', color: step.completed ? 'var(--color-olive)' : 'var(--color-muted)', fontWeight: 600 }}>
                            {step.completed ? 'Đã qua' : 'Chờ'}
                          </div>
                          <div style={{ fontSize: '0.86rem', fontWeight: step.current ? 600 : 500 }}>{step.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {canCancel && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                  <button
                    id={`cancel-order-${order.id ?? id}`}
                    className="btn btn-ghost"
                    style={{ color: '#B85042', fontSize: '0.88rem' }}
                    onClick={() => handleCancelOrder(order.id ?? id)}
                    disabled={isCancelling || loadingOrders}
                    aria-label={`Huỷ đơn hàng #${id}`}
                  >
                    {isCancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  const renderAddresses = () => {
    if (loadingAddresses) {
      return (
        <div className="empty-state" style={{ padding: '40px 24px' }} aria-busy="true">
          <p className="muted">Đang tải địa chỉ đã lưu...</p>
        </div>
      );
    }

    if (addressError) {
      return (
        <div className="empty-state" style={{ padding: '40px 24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '8px' }}>Chưa tải được địa chỉ</h3>
          <p className="muted">{addressError}</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Sổ địa chỉ</h2>
          {!showAddressForm && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddressForm(true)}>
              Thêm địa chỉ mới
            </button>
          )}
        </div>

        {showAddressForm && (
          <form onSubmit={handleSaveAddress} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px', background: 'var(--color-bg-soft)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px' }}>Thêm địa chỉ giao hàng mới</h3>
            {formError && <div style={{ color: '#B85042', fontSize: '0.88rem', marginBottom: '16px' }}>{formError}</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Họ và tên *</label>
                <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} required style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Số điện thoại *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Email (không bắt buộc)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Tỉnh/Thành phố *</label>
                <select value={selectedProvinceId} onChange={handleProvinceChange} required style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-bg)' }}>
                  <option value="">Chọn Tỉnh/Thành</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Quận/Huyện *</label>
                <select value={selectedDistrictId} onChange={handleDistrictChange} required disabled={!selectedProvinceId} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-bg)' }}>
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Phường/Xã *</label>
                <select value={selectedWardCode} onChange={e => setSelectedWardCode(e.target.value)} required disabled={!selectedDistrictId} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-bg)' }}>
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Địa chỉ chi tiết (số nhà, ngõ, tên đường) *</label>
              <input type="text" value={addressLine} onChange={e => setAddressLine(e.target.value)} required style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input type="checkbox" id="default-address-cb" checked={isDefaultAddress} onChange={e => setIsDefaultAddress(e.target.checked)} />
              <label htmlFor="default-address-cb" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Đặt làm địa chỉ mặc định</label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={submittingAddress}>
                {submittingAddress ? 'Đang lưu...' : 'Lưu địa chỉ'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowAddressForm(false); setFormError(''); }} disabled={submittingAddress}>
                Hủy bỏ
              </button>
            </div>
          </form>
        )}

        {addresses.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 24px', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '8px' }}>Chưa có địa chỉ đã lưu</h3>
            <p className="muted" style={{ marginBottom: '20px' }}>Bạn chưa lưu địa chỉ giao hàng nào.</p>
            {!showAddressForm && (
              <button className="btn btn-outline" onClick={() => setShowAddressForm(true)}>Thêm địa chỉ mới ngay</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {addresses.map((address) => (
              <article key={address.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '18px', background: 'var(--color-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
                      {address.recipientName || 'Người nhận'}
                      {address.defaultAddress && <span style={{ marginLeft: '8px', color: 'var(--color-olive)', fontSize: '0.82rem' }}>Mặc định</span>}
                    </h3>
                    <p className="muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {address.phone && <span>{address.phone}<br /></span>}
                      {address.email && <span>{address.email}<br /></span>}
                      {address.addressLine}, {address.wardName ? `${address.wardName}, ` : ''}{address.districtName ? `${address.districtName}, ` : ''}{address.provinceName || address.city}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {!address.defaultAddress && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleDefaultAddress(address.id)}>
                        Đặt mặc định
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" style={{ color: '#B85042' }} onClick={() => handleDeleteAddress(address.id)}>
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWishlist = () => {
    if (loadingWishlist) {
      return (
        <div className="empty-state" style={{ padding: '40px 24px' }} aria-busy="true">
          <p className="muted">Đang tải sản phẩm yêu thích...</p>
        </div>
      );
    }

    if (wishlistError) {
      return (
        <div className="empty-state" style={{ padding: '40px 24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '8px' }}>Chưa tải được wishlist</h3>
          <p className="muted">{wishlistError}</p>
        </div>
      );
    }

    if (wishlistItems.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '40px 24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '8px' }}>Chưa có sản phẩm yêu thích</h3>
          <p className="muted" style={{ marginBottom: '20px' }}>Nhấn biểu tượng trái tim trên sản phẩm để lưu lại tại đây.</p>
          <button className="btn btn-outline" onClick={() => navigate('/')}>Khám phá sản phẩm</button>
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {wishlistItems.map((item) => {
          const product = item.product || {};
          return (
            <article
              key={item.id || product.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--color-bg)',
                cursor: 'pointer',
              }}
              onClick={() => product.id && navigate(`/products/${product.id}`)}
            >
              <div style={{ aspectRatio: '4/3', background: 'var(--color-bg-soft)' }}>
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.productName || 'Sản phẩm'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ padding: '16px' }}>
                <div className="muted" style={{ fontSize: '0.82rem', marginBottom: '6px' }}>
                  {translateCategory(product.category, 'Nội thất')}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
                  {product.productName || 'Sản phẩm'}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                  <strong className="price">{money(product.price || 0)}</strong>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ color: '#B85042', padding: '6px 10px', fontSize: '0.86rem' }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveWishlist(product.id);
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="shell section-padding">
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 2.5fr', gap: '32px', alignItems: 'start' }}>
        <div className="card" style={{ padding: '32px 24px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 500, color: 'var(--color-wood)', marginBottom: '16px', border: '1px solid var(--color-border)' }}>
              {initials(user.userName)}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 500, fontFamily: 'var(--font-display)' }}>{user.userName}</h2>
            <p className="muted" style={{ fontSize: '0.9rem' }}>Thành viên từ năm 2026</p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} aria-label="Điều hướng tài khoản">
            <button 
              className="btn" 
              style={{ 
                justifyContent: 'flex-start', 
                background: activeTab === 'orders' ? 'var(--color-bg-soft)' : 'transparent', 
                color: activeTab === 'orders' ? 'var(--color-text)' : 'var(--color-muted)',
                fontWeight: activeTab === 'orders' ? 600 : 500, 
                borderRadius: '8px' 
              }}
              onClick={() => setActiveTab('orders')}
            >
              Đơn hàng của tôi
            </button>
            <button 
              className="btn" 
              style={{ 
                justifyContent: 'flex-start', 
                background: activeTab === 'addresses' ? 'var(--color-bg-soft)' : 'transparent', 
                color: activeTab === 'addresses' ? 'var(--color-text)' : 'var(--color-muted)',
                fontWeight: activeTab === 'addresses' ? 600 : 500, 
                borderRadius: '8px' 
              }}
              onClick={() => setActiveTab('addresses')}
            >
              Địa chỉ đã lưu
            </button>
            <button 
              className="btn" 
              style={{ 
                justifyContent: 'flex-start', 
                background: activeTab === 'wishlist' ? 'var(--color-bg-soft)' : 'transparent', 
                color: activeTab === 'wishlist' ? 'var(--color-text)' : 'var(--color-muted)',
                fontWeight: activeTab === 'wishlist' ? 600 : 500, 
                borderRadius: '8px' 
              }}
              onClick={() => setActiveTab('wishlist')}
            >
              Sản phẩm yêu thích
            </button>
            <button 
              className="btn btn-ghost" 
              style={{ 
                justifyContent: 'flex-start', 
                color: '#B85042', 
                marginTop: '16px', 
                borderRadius: '8px' 
              }} 
              onClick={() => { logout(); navigate('/'); }}
            >
              Đăng xuất
            </button>
          </nav>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          {activeTab === 'orders' && (
            <section className="card" style={{ padding: '32px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 300 }}>Lịch sử đơn hàng</h2>
                <button className="btn btn-outline" style={{ borderRadius: '8px' }} onClick={() => setReloadKey((value) => value + 1)} disabled={loadingOrders}>
                  Làm mới
                </button>
              </div>

              {/* Status Filter Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '12px',
                marginBottom: '20px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {ORDER_FILTERS.map(filter => (
                  <button
                    key={filter.key}
                    style={{
                      background: selectedStatusFilter === filter.key ? 'var(--color-text)' : 'transparent',
                      color: selectedStatusFilter === filter.key ? 'white' : 'var(--color-muted)',
                      border: '1px solid ' + (selectedStatusFilter === filter.key ? 'var(--color-text)' : 'var(--color-border)'),
                      borderRadius: '20px',
                      padding: '6px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setSelectedStatusFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {renderOrders()}
            </section>
          )}

          {activeTab === 'addresses' && (
            <section className="card" style={{ padding: '32px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 300 }}>Địa chỉ đã lưu</h2>
                <button className="btn btn-outline" style={{ borderRadius: '8px' }} onClick={() => setAddressReloadKey((value) => value + 1)} disabled={loadingAddresses}>
                  Làm mới
                </button>
              </div>

              {renderAddresses()}
            </section>
          )}

          {activeTab === 'wishlist' && (
            <section className="card" style={{ padding: '32px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 300 }}>Sản phẩm yêu thích</h2>
                <button className="btn btn-outline" style={{ borderRadius: '8px' }} onClick={() => navigate('/')}>
                  Mua thêm
                </button>
              </div>

              {renderWishlist()}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
