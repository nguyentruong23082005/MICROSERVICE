import { useEffect, useMemo, useRef, useState } from 'react';
import { GATEWAY_BASE_URL, get } from '../../api/client.js';
import { useAuth } from '../../features/auth/hooks/useAuth.js';

const SUPPORT_GUEST_STORAGE_KEY = 'furniq_support_guest_id';
const MAX_MESSAGE_LENGTH = 1000;
const MAX_RECONNECT_ATTEMPTS = 5;
const ADMIN_CHAT_ID = 'admin';
const SUPPORT_ENDPOINT_PATH = '/ws/support-chat';

function toWebSocketUrl(baseUrl) {
  return baseUrl.replace(/^http/i, 'ws');
}

function buildWebSocketUrl(activeUserId, guestId) {
  const base = `${toWebSocketUrl(GATEWAY_BASE_URL)}${SUPPORT_ENDPOINT_PATH}`;
  // Logged-in users: don't send guestId; Gateway injects X-User-Id from cookie.
  // Guests: send guestId so the handshake interceptor identifies them.
  if (activeUserId !== guestId) {
    return base;
  }
  return `${base}?guestId=${encodeURIComponent(guestId)}`;
}

async function getSupportHistory(guestId) {
  return get(`/support-chat/history/${encodeURIComponent(guestId)}`, {
    headers: { 'X-Guest-Id': guestId },
  });
}

function createGuestId() {
  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    : `${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
  return `guest_${randomPart}`;
}

function getGuestId() {
  if (typeof localStorage === 'undefined') return createGuestId();
  const existing = localStorage.getItem(SUPPORT_GUEST_STORAGE_KEY);
  if (existing?.startsWith('guest_')) return existing;
  const next = createGuestId();
  localStorage.setItem(SUPPORT_GUEST_STORAGE_KEY, next);
  return next;
}

function parseTimestamp(ts) {
  if (!ts) return new Date();
  if (typeof ts === 'number') {
    return new Date(ts < 10000000000 ? ts * 1000 : ts);
  }
  if (typeof ts === 'string' && /^\d+(\.\d+)?$/.test(ts)) {
    const val = parseFloat(ts);
    return new Date(val < 10000000000 ? val * 1000 : val);
  }
  const parsed = new Date(ts);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeMessage(message, currentUserId) {
  const parsedDate = parseTimestamp(message.createdAt || message.timestamp);
  return {
    id: message.id || `${message.senderId || currentUserId}_${parsedDate.getTime()}_${Math.random()}`,
    senderId: message.senderId || currentUserId,
    receiverId: message.receiverId || ADMIN_CHAT_ID,
    content: message.content || '',
    timestamp: parsedDate.toISOString(),
  };
}

function connectionLabel(connectionState) {
  if (connectionState === 'online') return 'Đang online';
  if (connectionState === 'connecting') return 'Đang kết nối';
  return 'Mất kết nối';
}

export default function SupportChatWidget() {
  const { user } = useAuth();
  const [guestId] = useState(() => getGuestId());
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connectionState, setConnectionState] = useState('connecting');
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const messagesEndRef = useRef(null);

  // Unread messages notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const activeUserId = useMemo(() => {
    return user?.userId ? String(user.userId) : guestId;
  }, [user, guestId]);

  const visibleMessages = useMemo(() => {
    if (messages.length > 0) return messages;
    return [{
      id: 'support-welcome',
      senderId: ADMIN_CHAT_ID,
      receiverId: activeUserId,
      content: 'Xin chào, Furniq có thể hỗ trợ bạn về đơn hàng nội thất, thanh toán, giao hàng cồng kềnh hoặc tư vấn sản phẩm. Nhắn ở đây để gặp nhân viên trực tuyến nhé.',
      timestamp: new Date().toISOString(),
    }];
  }, [activeUserId, messages]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, visibleMessages]);

  useEffect(() => {
    let shouldReconnect = true;

    const connect = () => {
      setConnectionState('connecting');
      const websocketUrl = buildWebSocketUrl(activeUserId, guestId);
      const socket = new WebSocket(websocketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        setIsSocketReady(true);
        setConnectionState('online');
        setErrorMessage('');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'STATUS') return;
          if (payload.type === 'ERROR') {
            setErrorMessage(payload.content || 'Không gửi được tin nhắn hỗ trợ.');
            return;
          }

          const normalized = normalizeMessage(payload, activeUserId);
          setMessages((current) => [...current, normalized]);

          // Increment unread count if message is from Admin and chat is closed
          if (!isOpenRef.current && normalized.senderId === ADMIN_CHAT_ID) {
            setUnreadCount((count) => count + 1);
          }
        } catch (error) {
          console.error('Invalid support chat payload:', error);
        }
      };

      socket.onerror = () => {
        // Intentional cleanup (e.g. login transition) — don't pollute the console.
        if (!shouldReconnect) return;
        setErrorMessage('Không kết nối được chat hỗ trợ. Vui lòng thử lại sau.');
        setIsSocketReady(false);
        setConnectionState('offline');
      };

      socket.onclose = () => {
        setIsSocketReady(false);
        if (!shouldReconnect) return;
        setConnectionState('offline');
        const attempt = Math.min(reconnectAttemptRef.current + 1, MAX_RECONNECT_ATTEMPTS);
        reconnectAttemptRef.current = attempt;
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
        if (attempt >= MAX_RECONNECT_ATTEMPTS) {
          setErrorMessage(`Chat hỗ trợ đã thử kết nối ${MAX_RECONNECT_ATTEMPTS} lần nhưng chưa thành công.`);
          return;
        }
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      shouldReconnect = false;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [activeUserId, guestId]);

  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const history = await getSupportHistory(activeUserId);
        if (!cancelled) {
          setMessages(Array.isArray(history) ? history.map((message) => normalizeMessage(message, activeUserId)) : []);
        }
      } catch (error) {
        if (!cancelled && error.status !== 404) {
          setErrorMessage(error.message || 'Không tải được lịch sử chat hỗ trợ.');
        }
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [activeUserId]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || !isSocketReady) return;
    if (content.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(`Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự.`);
      return;
    }

    socketRef.current.send(JSON.stringify({ receiverId: ADMIN_CHAT_ID, content }));
    setInput('');
    setErrorMessage('');
  };

  return (
    <div className="support-chat-root" aria-live="polite">
      {isOpen && (
        <section className="support-chat-window" aria-label="Chat trực tuyến với nhân viên Furniq">
          <header className="support-chat-header">
            <div className="support-chat-logo" aria-hidden="true">
              <i className="bi bi-headset" />
            </div>
            <div>
              <h2>Nhân viên hỗ trợ</h2>
              <p>{connectionLabel(connectionState)}</p>
            </div>
            <button id="support-chat-close-button" className="support-chat-close" type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chat hỗ trợ">
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </header>

          <div className="support-chat-messages" role="log" aria-label="Nội dung chat hỗ trợ trực tuyến">
            {isLoadingHistory && <div className="support-chat-system">Đang tải lịch sử hỗ trợ...</div>}
            {visibleMessages.map((message) => {
              const fromCustomer = String(message.senderId) === String(activeUserId);
              return (
                <article key={message.id} className={`support-chat-message ${fromCustomer ? 'from-customer' : 'from-admin'}`}>
                  <p>{message.content}</p>
                  <time dateTime={message.timestamp}>{new Date(message.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</time>
                </article>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {errorMessage && <div className="support-chat-error">{errorMessage}</div>}

          <form className="support-chat-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="support-chat-input">Nội dung cần hỗ trợ</label>
            <input
              id="support-chat-input"
              type="text"
              maxLength={MAX_MESSAGE_LENGTH}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={isSocketReady ? 'Nhập tin nhắn cho nhân viên...' : 'Đang kết nối hỗ trợ...'}
              disabled={!isSocketReady}
            />
            <button id="support-chat-send-button" type="submit" disabled={!input.trim() || !isSocketReady} aria-label="Gửi tin nhắn hỗ trợ">
              <i className="bi bi-send-fill" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button id="support-chat-open-button" className="support-chat-fab" type="button" onClick={() => {
        setIsOpen((current) => {
          const next = !current;
          if (next) setUnreadCount(0);
          return next;
        });
      }} aria-label="Mở chat trực tuyến với nhân viên" style={{ position: 'relative' }}>
        <span className={`support-chat-status-dot ${connectionState}`} aria-hidden="true" />
        <i className="bi bi-headset" aria-hidden="true" />
        <span>Hỗ trợ</span>
        {unreadCount > 0 && (
          <span className="support-chat-unread-badge" style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: '#B85042',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 10
          }}>
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

