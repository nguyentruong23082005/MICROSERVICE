import { CreditCard, TruckElectricIcon } from '../icons/index.js';

const PAYMENT_METHODS = Object.freeze([
  Object.freeze({
    id: 'COD',
    labelKey: 'payment.cod',
    descriptionKey: 'payment.cod_description',
    badge: 'COD',
    Icon: TruckElectricIcon,
  }),
  Object.freeze({
    id: 'VNPAY',
    labelKey: 'payment.vnpay',
    descriptionKey: 'payment.gateway_description',
    badge: 'VNPay',
    Icon: CreditCard,
  }),
  Object.freeze({
    id: 'MOMO',
    labelKey: 'payment.momo',
    descriptionKey: 'payment.gateway_description',
    badge: 'MoMo',
    Icon: CreditCard,
  }),
]);

export default function PaymentMethodSelector({ value, onChange, disabled, t }) {
  return (
    <fieldset className="payment-methods" disabled={disabled}>
      <legend className="payment-methods__legend">{t('payment.method')}</legend>
      <div className="payment-methods__grid">
        {PAYMENT_METHODS.map(({ id, labelKey, descriptionKey, badge, Icon }) => (
          <label
            className={`payment-method${value === id ? ' payment-method--selected' : ''}`}
            htmlFor={`payment-method-${id.toLowerCase()}`}
            key={id}
          >
            <input
              checked={value === id}
              className="payment-method__radio"
              id={`payment-method-${id.toLowerCase()}`}
              name="paymentMethod"
              onChange={() => onChange(id)}
              type="radio"
              value={id}
            />
            <span className="payment-method__icon" aria-hidden="true">
              <Icon size={24} />
            </span>
            <span className="payment-method__copy">
              <span className="payment-method__title">{t(labelKey)}</span>
              <span className="payment-method__description">{t(descriptionKey)}</span>
            </span>
            <span className={`payment-method__badge payment-method__badge--${id.toLowerCase()}`}>
              {badge}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}