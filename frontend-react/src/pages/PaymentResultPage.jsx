import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshIcon, SimpleCheckedIcon, XIcon } from '../components/icons/index.js';
import {
  getPaymentsByOrderId,
  resolvePaymentResult,
} from '../features/payment/services/paymentService.js';

const INITIAL_RESULT = Object.freeze({ state: 'loading', payment: null });
const GATEWAY_STATUS_STATES = Object.freeze({
  success: 'success',
  failed: 'failed',
  pending: 'pending',
});

function resultFromGatewayStatus(status) {
  const normalizedStatus = String(status || '').toLowerCase();
  return Object.freeze({
    state: GATEWAY_STATUS_STATES[normalizedStatus] || 'failed',
    payment: null,
  });
}

function ResultIcon({ state }) {
  if (state === 'success') {
    return <SimpleCheckedIcon size={42} strokeWidth={1.8} />;
  }

  if (state === 'failed' || state === 'error') {
    return <XIcon size={38} strokeWidth={1.8} />;
  }

  return <RefreshIcon size={38} strokeWidth={1.8} />;
}

export default function PaymentResultPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const gatewayStatus = searchParams.get('status');
  const [result, setResult] = useState(INITIAL_RESULT);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!orderId) {
      setResult(resultFromGatewayStatus(gatewayStatus));
      setError('');
      return;
    }

    setIsRefreshing(true);
    try {
      const payments = await getPaymentsByOrderId(orderId);
      setResult(resolvePaymentResult(orderId, payments));
      setError('');
    } catch {
      setResult(Object.freeze({ state: 'error', payment: null }));
      setError(t('payment.result_error'));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    if (!orderId) {
      return () => {
        active = false;
      };
    }

    getPaymentsByOrderId(orderId)
      .then((payments) => {
        if (!active) return;
        setResult(resolvePaymentResult(orderId, payments));
        setError('');
      })
      .catch(() => {
        if (!active) return;
        setResult(Object.freeze({ state: 'error', payment: null }));
        setError(t('payment.result_error'));
      });

    return () => {
      active = false;
    };
  }, [orderId, t]);

  const displayResult = orderId ? result : resultFromGatewayStatus(gatewayStatus);
  const state = displayResult.state;
  const isBusy = state === 'loading' || isRefreshing;
  const title = t(`payment.result_${state}_title`);
  const description = error || t(`payment.result_${state}_description`);

  return (
    <main className="payment-result-page shell section-padding">
      <section
        className={`payment-result payment-result--${state}`}
        aria-labelledby="payment-result-title"
        aria-live="polite"
      >
        <div className="payment-result__glow" aria-hidden="true" />
        <div className="payment-result__icon" aria-hidden="true">
          {state === 'loading' ? (
            <span className="loading-spinner" />
          ) : (
            <ResultIcon state={state} />
          )}
        </div>

        <p className="eyebrow">{t('payment.result_eyebrow')}</p>
        <h1 id="payment-result-title">{title}</h1>
        <p className="payment-result__description">{description}</p>

        {orderId && state !== 'error' && (
          <div className="payment-result__reference">
            <span>{t('order.order_id')}</span>
            <strong>#{orderId}</strong>
          </div>
        )}

        <div className="payment-result__actions">
          {state === 'pending' && (
            <button
              id="payment-result-refresh"
              className="btn btn-primary"
              type="button"
              onClick={handleRefresh}
              disabled={isBusy}
            >
              <RefreshIcon size={18} />
              {isRefreshing ? t('payment.result_refreshing') : t('payment.result_refresh')}
            </button>
          )}

          {orderId && state !== 'error' && (
            <Link id="payment-result-order-link" className="btn btn-secondary" to={`/orders/${orderId}`}>
              {t('payment.view_order')}
            </Link>
          )}

          <Link id="payment-result-home-link" className="btn btn-ghost" to="/">
            {t('error.go_home')}
          </Link>
        </div>

        {state === 'pending' && (
          <p className="payment-result__security-note">{t('payment.result_security_note')}</p>
        )}
      </section>
    </main>
  );
}
