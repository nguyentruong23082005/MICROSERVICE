import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../features/cart/hooks/useCart.js';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import { getUserProfile } from '../features/auth/services/authService.js';
import { createOrder, calculateShippingFee, getShippingDistricts, getShippingProvinces, getShippingWards } from '../features/orders/services/orderService.js';
import { createGatewayPayment } from '../features/payment/index.js';
import { previewCoupon, getActiveCoupons } from '../features/coupons/index.js';
import { createAddress, getAddresses } from '../features/addresses/index.js';
import PaymentMethodSelector from '../components/ui/PaymentMethodSelector.jsx';
import { money } from '../utils/formatters.js';
import { SimpleCheckedIcon } from '../components/icons/index.js';

const DEFAULT_SHIPPING_FEE = 120000;
const FREE_SHIPPING_THRESHOLD = 3000000;
const BULKY_PARCEL = {
  totalWeightGram: 15000,
  lengthCm: 120,
  widthCm: 80,
  heightCm: 80,
};

function toPlainText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

function locationName(list, idOrCode, key = 'id') {
  return list.find((item) => String(item[key]) === String(idOrCode))?.name || '';
}

function formatGatewayCheckoutError(baseMessage, error) {
  const detail = error instanceof Error && error.message ? error.message : '';
  return detail ? `${baseMessage} (${detail})` : baseMessage;
}

/**
 * Retries createGatewayPayment with exponential backoff to handle the Kafka
 * propagation delay between order-service publishing OrderCreatedEvent and
 * payment-service consuming it to create the payment intent.
 */
const GATEWAY_RETRY_DELAYS = [800, 1500, 2500, 4000];

async function retryGatewayPayment(method, orderId) {
  let lastError;
  for (let attempt = 0; attempt <= GATEWAY_RETRY_DELAYS.length; attempt++) {
    try {
      return await createGatewayPayment(method, orderId);
    } catch (err) {
      lastError = err;
      const isTransient = err?.message?.includes('Payment intent not found');
      if (!isTransient || attempt >= GATEWAY_RETRY_DELAYS.length) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, GATEWAY_RETRY_DELAYS[attempt]));
    }
  }
  throw lastError;
}

export default function CheckoutPage() {
  const { items, cartTotal, clearCart, cartId } = useCart();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: user?.userName || '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [shippingLocations, setShippingLocations] = useState({ provinces: [], districts: [], wards: [] });
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [loadingShippingLocations, setLoadingShippingLocations] = useState(false);
  const [calculatingShippingFee, setCalculatingShippingFee] = useState(false);
  const [shippingFee, setShippingFee] = useState(DEFAULT_SHIPPING_FEE);
  const [shippingFeeEstimated, setShippingFeeEstimated] = useState(true);
  const [shippingFeeError, setShippingFeeError] = useState('');

  useEffect(() => {
    if (!user?.userId) return;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoadingAddresses(true);
        return getAddresses(user.userId);
      })
      .then((data) => {
        if (active && data) setAddresses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setAddresses([]);
      })
      .finally(() => {
        if (active) setLoadingAddresses(false);
      });
    return () => { active = false; };
  }, [user?.userId]);

  // Tải thông tin cá nhân khách hàng để điền sẵn vào form
  useEffect(() => {
    if (!user?.userId) return;
    let active = true;
    getUserProfile(user.userId)
      .then((profile) => {
        if (!active || !profile) return;
        setForm((prev) => ({
          ...prev,
          firstName: profile.userDetails?.firstName || profile.userName || prev.firstName,
          lastName: profile.userDetails?.lastName || prev.lastName,
          email: profile.userDetails?.email || prev.email,
          phone: profile.userDetails?.phoneNumber || prev.phone,
          address: profile.userDetails?.street || prev.address,
          city: profile.userDetails?.locality || prev.city,
        }));
      })
      .catch((err) => {
        console.error('Failed to load user profile in CheckoutPage:', err);
      });
    return () => { active = false; };
  }, [user?.userId]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleAddressSelect = (event) => {
    const address = addresses.find((item) => String(item.id) === event.target.value);
    if (!address) return;
    const parts = String(address.recipientName || '').trim().split(' ').filter(Boolean);
    setForm((prev) => ({
      firstName: parts.slice(0, -1).join(' ') || address.recipientName || prev.firstName || '',
      lastName: parts.length > 1 ? parts[parts.length - 1] : prev.lastName || '',
      email: prev.email || address.email || '',
      phone: address.phone || prev.phone || '',
      address: address.addressLine || prev.address || '',
      city: address.provinceName || address.city || prev.city || '',
    }));

    if (address.provinceId) {
      setSelectedProvinceId(String(address.provinceId));
      setSelectedDistrictId(address.districtId ? String(address.districtId) : '');
      setSelectedWardCode(address.wardCode || '');
      return;
    }

    const matchedProvince = shippingLocations.provinces.find((province) =>
      toPlainText(address.city).includes(toPlainText(province.name)) || toPlainText(province.name).includes(toPlainText(address.city))
    );
    if (matchedProvince) {
      setSelectedProvinceId(String(matchedProvince.id));
    }
  };

  const handleProvinceChange = (event) => {
    const provinceId = event.target.value;
    setSelectedProvinceId(provinceId);
    setSelectedDistrictId('');
    setSelectedWardCode('');
    setShippingLocations((current) => ({ ...current, districts: [], wards: [] }));
    setForm((current) => ({ ...current, city: locationName(shippingLocations.provinces, provinceId) }));
  };

  const handleDistrictChange = (event) => {
    setSelectedDistrictId(event.target.value);
    setSelectedWardCode('');
    setShippingLocations((current) => ({ ...current, wards: [] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setSubmitError('');
    let pendingOrderId = createdOrderId;

    try {
      if (!user?.userId || (!cartId && !pendingOrderId)) {
        throw new Error('Không xác định được tài khoản hoặc giỏ hàng.');
      }

      if (!pendingOrderId) {
        const clean = (value) => String(value || '').trim();
        const provinceName = locationName(shippingLocations.provinces, selectedProvinceId);
        const districtName = locationName(shippingLocations.districts, selectedDistrictId);
        const wardName = locationName(shippingLocations.wards, selectedWardCode, 'code');
        const fullShippingAddress = [clean(form.address), wardName, districtName, provinceName].filter(Boolean).join(', ');
        const shippingInfo = {
          shippingName: [clean(form.firstName), clean(form.lastName)].filter(Boolean).join(' '),
          shippingEmail: clean(form.email),
          shippingPhone: clean(form.phone),
          shippingAddress: fullShippingAddress || clean(form.address),
          shippingCity: provinceName || clean(form.city),
          couponCode: appliedCoupon?.code || '',
          shippingFee,
        };

        const createdOrder = await createOrder(user.userId, cartId, shippingInfo);
        pendingOrderId = Number(createdOrder?.id);
        if (!Number.isSafeInteger(pendingOrderId) || pendingOrderId <= 0) {
          throw new Error('Phản hồi tạo đơn hàng không hợp lệ.');
        }
        setCreatedOrderId(pendingOrderId);

        if (saveAddress) {
          createAddress(user.userId, {
            recipientName: shippingInfo.shippingName,
            email: shippingInfo.shippingEmail,
            phone: shippingInfo.shippingPhone,
            addressLine: clean(form.address),
            city: shippingInfo.shippingCity,
            provinceId: selectedProvinceId ? Number(selectedProvinceId) : null,
            provinceName,
            districtId: selectedDistrictId ? Number(selectedDistrictId) : null,
            districtName,
            wardCode: selectedWardCode || null,
            wardName,
            defaultAddress: addresses.length === 0,
          }).catch((err) => console.error('Address save failed:', err));
        }
      }

      if (paymentMethod === 'COD') {
        clearCart();
        setSuccess(true);
        return;
      }

      const payUrl = await retryGatewayPayment(paymentMethod, pendingOrderId);
      clearCart();
      window.location.assign(payUrl);
    } catch (err) {
      console.error('Checkout processing failed:', err);
      const gatewayRetryMessage = pendingOrderId && paymentMethod !== 'COD'
        ? formatGatewayCheckoutError(t('payment.gateway_error'), err)
        : null;
      setSubmitError(gatewayRetryMessage || err.message || 'Không thể xử lý đơn hàng. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyCoupon = async (event) => {
    event.preventDefault();
    const code = couponCode.trim();
    if (!code) {
      setAppliedCoupon(null);
      setCouponError('');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');
    try {
      const preview = await previewCoupon(code, cartTotal);
      setAppliedCoupon(preview);
      setCouponCode(preview.code);
    } catch {
      setAppliedCoupon(null);
      setCouponError('Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleUseVoucher = async (code) => {
    setCouponCode(code);
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const preview = await previewCoupon(code, cartTotal);
      setAppliedCoupon(preview);
      setCouponCode(preview.code);
    } catch {
      setAppliedCoupon(null);
      setCouponError('Voucher này chưa đủ điều kiện cho giỏ hàng hiện tại.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoadingShippingLocations(true);
        return getShippingProvinces();
      })
      .then((data) => {
        if (active && data) {
          setShippingLocations((current) => ({ ...current, provinces: Array.isArray(data) ? data : [] }));
        }
      })
      .catch(() => {
        if (active) setShippingFeeError('Không tải được danh sách tỉnh/thành GHN.');
      })
      .finally(() => {
        if (active) setLoadingShippingLocations(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoadingCoupons(true);
        return getActiveCoupons();
      })
      .then((data) => {
        if (active && data) setAvailableCoupons(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setAvailableCoupons([]);
      })
      .finally(() => {
        if (active) setLoadingCoupons(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) return;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoadingShippingLocations(true);
        return getShippingDistricts(selectedProvinceId);
      })
      .then((data) => {
        if (active && data) {
          setShippingLocations((current) => ({ ...current, districts: Array.isArray(data) ? data : [], wards: [] }));
        }
      })
      .catch(() => {
        if (active) setShippingFeeError('Không tải được danh sách quận/huyện GHN.');
      })
      .finally(() => {
        if (active) setLoadingShippingLocations(false);
      });
    return () => { active = false; };
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!selectedDistrictId) return;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoadingShippingLocations(true);
        return getShippingWards(selectedDistrictId);
      })
      .then((data) => {
        if (active && data) {
          setShippingLocations((current) => ({ ...current, wards: Array.isArray(data) ? data : [] }));
        }
      })
      .catch(() => {
        if (active) setShippingFeeError('Không tải được danh sách phường/xã GHN.');
      })
      .finally(() => {
        if (active) setLoadingShippingLocations(false);
      });
    return () => { active = false; };
  }, [selectedDistrictId]);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        if (Number(cartTotal) >= FREE_SHIPPING_THRESHOLD) {
          setShippingFee(0);
          setShippingFeeEstimated(false);
          setShippingFeeError('');
          return null;
        }
        if (!selectedDistrictId || !selectedWardCode) {
          setShippingFee(DEFAULT_SHIPPING_FEE);
          setShippingFeeEstimated(true);
          return null;
        }

        setCalculatingShippingFee(true);
        setShippingFeeError('');
        return calculateShippingFee({
          toDistrictId: Number(selectedDistrictId),
          toWardCode: selectedWardCode,
          ...BULKY_PARCEL,
        });
      })
      .then((data) => {
        if (!active || !data) return;
        const fee = Number(data?.fee ?? DEFAULT_SHIPPING_FEE);
        setShippingFee(Number.isFinite(fee) ? fee : DEFAULT_SHIPPING_FEE);
        setShippingFeeEstimated(Boolean(data?.estimated));
      })
      .catch(() => {
        if (!active) return;
        setShippingFee(DEFAULT_SHIPPING_FEE);
        setShippingFeeEstimated(true);
        setShippingFeeError('Không tính được phí GHN, đang dùng phí tạm tính.');
      })
      .finally(() => {
        if (active) setCalculatingShippingFee(false);
      });
    return () => { active = false; };
  }, [cartTotal, selectedDistrictId, selectedWardCode]);

  if (success) {
    return (
      <div className="shell section-padding" style={{ textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 32px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-olive)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', border: '1px solid var(--color-border)' }}>
            <SimpleCheckedIcon size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: 300, fontFamily: 'var(--font-display)' }}>Đặt hàng thành công</h1>
          <p className="muted" style={{ marginBottom: '32px', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Cảm ơn bạn đã mua sắm tại Furniq. Đơn hàng đang được xử lý và chúng tôi sẽ sớm liên hệ xác nhận.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>Xem đơn hàng</button>
            <button className="btn btn-outline" style={{ borderRadius: '9999px' }} onClick={() => navigate('/')}>Quay lại cửa hàng</button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="shell section-padding" style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Không thể thanh toán khi giỏ hàng đang trống.</h2>
        <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>Mua sắm ngay</button>
      </div>
    );
  }

  const discountTotal = Number(appliedCoupon?.discountTotal || 0);
  const finalTotal = Math.max(0, Number(appliedCoupon?.total ?? cartTotal) + shippingFee);

  return (
    <div className="shell section-padding">
      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '64px', alignItems: 'start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '32px', fontWeight: 300, fontFamily: 'var(--font-display)' }}>Thanh toán</h1>
          <form id="checkout-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="card" style={{ marginBottom: '24px', padding: '32px', borderRadius: 'var(--radius-md)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 500, fontFamily: 'var(--font-display)' }}>Thông tin liên hệ</h2>
              <div className="input-group">
                <label htmlFor="checkout-email">Địa chỉ email</label>
                <input id="checkout-email" className="input-field" type="email" name="email" value={form.email} onChange={handleChange} required placeholder="Email" autoComplete="off" />
              </div>
              <div className="input-group">
                <label htmlFor="checkout-phone">Số điện thoại</label>
                <input id="checkout-phone" className="input-field" type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="Số điện thoại" autoComplete="off" />
              </div>
            </div>

            <div className="card" style={{ marginBottom: '24px', padding: '32px', borderRadius: 'var(--radius-md)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 500, fontFamily: 'var(--font-display)' }}>Địa chỉ giao hàng</h2>
              {addresses.length > 0 && (
                <div className="input-group">
                  <label htmlFor="saved-address">Địa chỉ đã lưu</label>
                  <select id="saved-address" className="input-field" defaultValue="" onChange={handleAddressSelect} disabled={loadingAddresses}>
                    <option value="">Chọn địa chỉ</option>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.recipientName} - {address.addressLine}, {address.wardName ? `${address.wardName}, ` : ''}{address.districtName ? `${address.districtName}, ` : ''}{address.provinceName || address.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="checkout-first-name">Tên</label>
                  <input id="checkout-first-name" className="input-field" type="text" name="firstName" value={form.firstName} onChange={handleChange} required autoComplete="off" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="checkout-last-name">Họ</label>
                  <input id="checkout-last-name" className="input-field" type="text" name="lastName" value={form.lastName} onChange={handleChange} required autoComplete="off" />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="checkout-address">Địa chỉ</label>
                <input id="checkout-address" className="input-field" type="text" name="address" value={form.address} onChange={handleChange} required autoComplete="off" placeholder="Số nhà, tên đường" />
              </div>
              <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="checkout-province">Tỉnh/Thành phố</label>
                  <select id="checkout-province" className="input-field" value={selectedProvinceId} onChange={handleProvinceChange} required disabled={loadingShippingLocations && shippingLocations.provinces.length === 0}>
                    <option value="">Chọn tỉnh/thành GHN</option>
                    {shippingLocations.provinces.map((province) => (
                      <option key={province.id} value={province.id}>{province.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="checkout-district">Quận/Huyện</label>
                  <select id="checkout-district" className="input-field" value={selectedDistrictId} onChange={handleDistrictChange} required disabled={!selectedProvinceId || loadingShippingLocations}>
                    <option value="">Chọn quận/huyện</option>
                    {shippingLocations.districts.map((district) => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="checkout-ward">Phường/Xã</label>
                <select id="checkout-ward" className="input-field" value={selectedWardCode} onChange={(event) => setSelectedWardCode(event.target.value)} required disabled={!selectedDistrictId || loadingShippingLocations}>
                  <option value="">Chọn phường/xã</option>
                  {shippingLocations.wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>{ward.name}</option>
                  ))}
                </select>
              </div>
              {shippingFeeError && (
                <p role="alert" style={{ marginTop: '-4px', marginBottom: '16px', color: '#B85042', fontSize: '0.88rem' }}>
                  {shippingFeeError}
                </p>
              )}
              <label style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-muted)', fontSize: '0.92rem' }}>
                <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-text)' }} />
                Lưu địa chỉ này cho lần sau
              </label>
            </div>

            <div className="card checkout-payment-card">
              <PaymentMethodSelector
                disabled={processing || Boolean(createdOrderId)}
                onChange={setPaymentMethod}
                t={t}
                value={paymentMethod}
              />
              {paymentMethod !== 'COD' && (
                <p className="payment-methods__notice" role="note">
                  {t('payment.redirect_notice')}
                </p>
              )}
            </div>
          </form>
        </div>

        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="card" style={{ padding: '32px', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontFamily: 'var(--font-display)', fontWeight: 500 }}>Tóm tắt đơn hàng</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '64px', height: '64px', background: 'var(--color-bg-soft)', borderRadius: '8px', overflow: 'hidden' }}>
                      {(item.productImageUrl || item.imageUrl) && (
                        <img src={item.productImageUrl || item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-text)', color: 'white', fontSize: '10px', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.quantity}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{item.productName}</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{money(item.productPrice || item.price)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input
                  className="input-field"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value);
                    setAppliedCoupon(null);
                    setCouponError('');
                  }}
                  placeholder="Mã giảm giá"
                  aria-label="Mã giảm giá"
                  style={{ height: '44px' }}
                />
                <button className="btn btn-outline" type="submit" disabled={applyingCoupon} style={{ height: '44px', padding: '0 16px', flex: '0 0 auto', borderRadius: '8px' }}>
                  {applyingCoupon ? 'Đang áp dụng' : 'Áp dụng'}
                </button>
              </form>
              {appliedCoupon && (
                <p style={{ marginTop: '-12px', marginBottom: '20px', color: 'var(--color-olive)', fontSize: '0.9rem' }}>
                  Đã áp dụng {appliedCoupon.code}: -{money(appliedCoupon.discountTotal)}
                </p>
              )}
              {couponError && (
                <p role="alert" style={{ marginTop: '-12px', marginBottom: '20px', color: '#B85042', fontSize: '0.9rem' }}>
                  {couponError}
                </p>
              )}
              {availableCoupons.length > 0 && (
                <div style={{ marginTop: '-8px', marginBottom: '24px' }}>
                  <p className="muted" style={{ marginBottom: '10px', fontSize: '0.88rem' }}>
                    Ví voucher khả dụng{loadingCoupons ? ' đang tải...' : ''}
                  </p>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {availableCoupons.slice(0, 3).map((coupon) => (
                      <button
                        key={coupon.id || coupon.code}
                        type="button"
                        onClick={() => handleUseVoucher(coupon.code)}
                        disabled={applyingCoupon}
                        style={{
                          border: '1px solid var(--color-border)',
                          background: appliedCoupon?.code === coupon.code ? 'rgba(12, 113, 61, 0.08)' : 'var(--color-surface)',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <strong style={{ color: 'var(--color-olive)' }}>{coupon.code}</strong>
                        <span className="muted" style={{ display: 'block', marginTop: '4px', fontSize: '0.84rem' }}>
                          {coupon.description || 'Bấm để áp dụng voucher cho đơn hàng này'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--color-muted)', fontSize: '0.95rem' }}>
                <span>Tạm tính</span>
                <span className="price" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{money(cartTotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--color-olive)', fontSize: '0.95rem' }}>
                  <span>Giảm giá</span>
                  <span className="price" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>-{money(discountTotal)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', color: 'var(--color-muted)', fontSize: '0.95rem' }}>
                <span>Phí vận chuyển</span>
                <span>{calculatingShippingFee ? 'Đang tính...' : shippingFee === 0 ? 'Miễn phí' : money(shippingFee)}</span>
              </div>
              {shippingFeeEstimated && shippingFee > 0 && (
                <p style={{ marginTop: '-16px', marginBottom: '20px', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                  Phí hiện tại là tạm tính cho hàng cồng kềnh; chọn đủ quận/phường để lấy phí GHN chính xác.
                </p>
              )}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', fontWeight: 500, fontSize: '1.5rem' }}>
                <span>Tổng cộng</span>
                <span className="price" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{money(finalTotal)}</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="btn btn-primary btn-full"
                style={{ height: '56px', fontSize: '1.1rem' }}
                disabled={processing}
              >
                {processing
                  ? t('payment.processing')
                  : createdOrderId && paymentMethod !== 'COD'
                    ? t('payment.retry_gateway')
                    : `Thanh toán ${money(finalTotal)}`}
              </button>
              {submitError && (
                <p role="alert" style={{ marginTop: '16px', color: '#B85042', fontSize: '0.92rem' }}>
                  {submitError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
