import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { GATEWAY_BASE_URL, get } from '../../../api/client.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { adminGetUserById } from '../services/adminService.js';
import {
  appendUniqueMessage,
  buildAdminChatWebSocketUrl,
  buildCustomerIdentity,
  getAdminSupport,
  isRegisteredCustomerId,
  reduceChatConnection,
} from './adminChatModel.js';

const ADMIN_CHAT_ID = 'admin';
const MAX_RECONNECT_ATTEMPTS = 5;


function createMessageId(message) {
  return `${message.senderId}_${message.receiverId}_${message.timestamp || Date.now()}_${Math.random()}`;
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

function normalizeHistoryMessage(message) {
  const parsedDate = parseTimestamp(message.createdAt || message.timestamp);
  return {
    id: message.id || createMessageId(message),
    senderId: message.senderId,
    receiverId: message.receiverId,
    customerId: message.customerId,
    content: message.content || '',
    timestamp: parsedDate.toISOString(),
  };
}

export default function AdminChat() {
  const { adminUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [messagesByCustomer, setMessagesByCustomer] = useState({});
  const [inputText, setInputText] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  const [connection, dispatchConnection] = useReducer(reduceChatConnection, {
    status: 'connecting',
    ready: false,
    error: null,
  });
  const [customerProfiles, setCustomerProfiles] = useState({});
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const threadEndRef = useRef(null);

  // Unread messages per session state
  const [unreadSessions, setUnreadSessions] = useState({});
  const selectedCustomerIdRef = useRef(selectedCustomerId);

  useEffect(() => {
    selectedCustomerIdRef.current = selectedCustomerId;
    if (selectedCustomerId) {
      setUnreadSessions((prev) => ({ ...prev, [selectedCustomerId]: 0 }));
    }
  }, [selectedCustomerId]);

  const selectedMessages = useMemo(
    () => messagesByCustomer[selectedCustomerId] || [],
    [messagesByCustomer, selectedCustomerId]
  );

  const identityFor = useCallback((customerId) => {
    const profileState = customerProfiles[customerId];
    return buildCustomerIdentity(customerId, profileState?.profile, {
      profileMissing: profileState?.status === 'missing',
      profileError: profileState?.status === 'error',
    });
  }, [customerProfiles]);

  const selectedIdentity = useMemo(
    () => selectedCustomerId ? identityFor(selectedCustomerId) : null,
    [identityFor, selectedCustomerId]
  );

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((first, second) => {
      const firstOnline = onlineUsers[first] ? 1 : 0;
      const secondOnline = onlineUsers[second] ? 1 : 0;
      if (firstOnline !== secondOnline) return secondOnline - firstOnline;
      return identityFor(first).displayName.localeCompare(identityFor(second).displayName, 'vi');
    });
  }, [identityFor, onlineUsers, sessions]);

  const refreshSessions = useCallback(async () => {
    setLoadingSessions(true);
    setError(null);
    try {
      const data = await getAdminSupport('/support-chat/sessions', get);
      const sessionList = Array.isArray(data) ? data : [];
      setSessions(sessionList);
      setSelectedCustomerId((previous) => previous || sessionList[0] || null);
    } catch (requestError) {
      setError(requestError.message || 'Không tải được danh sách phiên chat.');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(refreshSessions, 0);
    return () => window.clearTimeout(task);
  }, [refreshSessions]);

  useEffect(() => {
    const unresolvedIds = sessions.filter((customerId) => (
      isRegisteredCustomerId(customerId) && !customerProfiles[customerId]
    ));
    if (unresolvedIds.length === 0) return;

    setCustomerProfiles((previous) => unresolvedIds.reduce(
      (next, customerId) => ({ ...next, [customerId]: { status: 'loading', profile: null } }),
      previous
    ));

    unresolvedIds.forEach(async (customerId) => {
      try {
        const profile = await adminGetUserById(customerId);
        setCustomerProfiles((previous) => ({
          ...previous,
          [customerId]: { status: 'ready', profile },
        }));
      } catch (profileError) {
        setCustomerProfiles((previous) => ({
          ...previous,
          [customerId]: {
            status: profileError?.status === 404 ? 'missing' : 'error',
            profile: null,
            message: profileError?.message || 'Không tải được hồ sơ khách hàng.',
          },
        }));
      }
    });
  }, [customerProfiles, sessions]);

  useEffect(() => {
    if (!selectedCustomerId) return;
    let cancelled = false;

    const loadHistory = async () => {
      setLoadingHistory(true);
      setError(null);
      try {
        const data = await getAdminSupport(`/support-chat/history/${encodeURIComponent(selectedCustomerId)}`, get);
        if (!cancelled) {
          setMessagesByCustomer((previous) => ({
            ...previous,
            [selectedCustomerId]: Array.isArray(data) ? data.map(normalizeHistoryMessage) : [],
          }));
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || 'Không tải được lịch sử chat.');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages]);

  useEffect(() => {
    let shouldReconnect = true;

    const connect = () => {
      dispatchConnection({ type: 'connecting' });
      const socket = new WebSocket(buildAdminChatWebSocketUrl(GATEWAY_BASE_URL));
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        setError(null);
        dispatchConnection({ type: 'connected' });
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'STATUS') {
            setOnlineUsers((previous) => ({ ...previous, [payload.senderId]: payload.content === 'ONLINE' }));
            return;
          }
          if (payload.type === 'ERROR') {
            setError(payload.content || 'Có lỗi khi gửi tin nhắn.');
            return;
          }

          const customerId = payload.senderId === ADMIN_CHAT_ID ? payload.receiverId : payload.senderId;
          const normalized = normalizeHistoryMessage({ ...payload, customerId });
          setSessions((previous) => previous.includes(customerId) ? previous : [customerId, ...previous]);
          setSelectedCustomerId((previous) => previous || customerId);
          setMessagesByCustomer((previous) => ({
            ...previous,
            [customerId]: appendUniqueMessage(previous[customerId] || [], normalized),
          }));

          // Increment unread count if message is from customer and they are not currently selected
          if (payload.senderId !== ADMIN_CHAT_ID && selectedCustomerIdRef.current !== customerId) {
            setUnreadSessions((prev) => ({
              ...prev,
              [customerId]: (prev[customerId] || 0) + 1,
            }));
          }
        } catch (parseError) {
          console.error('Invalid admin support chat payload:', parseError);
        }
      };

      socket.onerror = () => {
        const hasNextAttempt = reconnectAttemptRef.current + 1 < MAX_RECONNECT_ATTEMPTS;
        dispatchConnection({
          type: 'candidate-failed',
          hasNextCandidate: hasNextAttempt,
        });
      };

      socket.onclose = () => {
        if (!shouldReconnect) return;
        const attempt = reconnectAttemptRef.current + 1;
        reconnectAttemptRef.current = attempt;
        if (attempt >= MAX_RECONNECT_ATTEMPTS) {
          dispatchConnection({
            type: 'failed',
            message: 'Không kết nối được chat admin qua gateway.',
          });
          return;
        }
        dispatchConnection({ type: 'candidate-failed', hasNextCandidate: true });
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      shouldReconnect = false;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, []);

  const handleSendMessage = (event) => {
    event.preventDefault();
    const content = inputText.trim();
    if (!content || !selectedCustomerId || !connection.ready) return;
    socketRef.current.send(JSON.stringify({ receiverId: selectedCustomerId, content }));
    setInputText('');
  };

  return (
    <div className="admin-page-shell admin-chat-page">
      <div className="admin-page-head admin-chat-head">
        <div>
          <span className="admin-notifications-eyebrow">Realtime support</span>
          <h1 className="admin-page-title">Trung tâm chat khách hàng</h1>
          <p className="admin-subtitle">Nhận và phản hồi tin nhắn trực tuyến từ khách vãng lai hoặc khách đã đăng nhập.</p>
        </div>
        <button id="refresh-admin-chat-sessions" className="admin-btn-secondary" type="button" onClick={refreshSessions} disabled={loadingSessions}>Làm mới phiên</button>
      </div>

      {(error || connection.error) && <div className="admin-notice admin-notice-error">{error || connection.error}</div>}

      <section className="admin-chat-metrics" aria-label="Tổng quan chat hỗ trợ">
        <article className="admin-chat-metric admin-chat-metric--dark">
          <span>Trạng thái</span>
          <strong>{connection.status === 'online' ? 'Online' : connection.status === 'connecting' || connection.status === 'reconnecting' ? 'Đang nối' : 'Offline'}</strong>
          <small>{adminUser?.userName ? `Admin ${adminUser.userName}` : 'Tài khoản quản trị'}</small>
        </article>
        <article className="admin-chat-metric">
          <span>Phiên chat</span>
          <strong>{sessions.length}</strong>
          <small>Khách đã phát sinh hội thoại</small>
        </article>
        <article className="admin-chat-metric admin-chat-metric--accent">
          <span>Đang online</span>
          <strong>{Object.values(onlineUsers).filter(Boolean).length}</strong>
          <small>Tín hiệu realtime từ WebSocket</small>
        </article>
      </section>

      <section className="admin-chat-console" aria-label="Bảng điều khiển chat hỗ trợ">
        <aside className="admin-chat-sessions">
          <div className="admin-chat-panel-head"><div><span>Inbox</span><h2>Khách hàng</h2></div></div>
          {loadingSessions && <div className="admin-empty">Đang tải phiên chat...</div>}
          {!loadingSessions && sortedSessions.length === 0 && <div className="admin-empty">Chưa có cuộc trò chuyện nào.</div>}
          <div className="admin-chat-session-list" role="list">
            {sortedSessions.map((customerId) => {
              const identity = identityFor(customerId);
              const profileState = customerProfiles[customerId];
              return (
                <button id={`admin-chat-session-${customerId}`} key={customerId} type="button" className={`admin-chat-session ${selectedCustomerId === customerId ? 'active' : ''}`} onClick={() => setSelectedCustomerId(customerId)}>
                  <span className={`admin-chat-avatar ${onlineUsers[customerId] ? 'online' : ''}`} aria-hidden="true">{identity.displayName.slice(0, 2).toUpperCase()}</span>
                  <span className="admin-chat-session-copy">
                    <strong>{profileState?.status === 'loading' ? 'Đang tải hồ sơ...' : identity.displayName}</strong>
                    <small>{onlineUsers[customerId] ? 'Đang online' : identity.kind === 'guest' ? `Guest · ${customerId}` : `ID ${customerId}`}</small>
                  </span>
                  {unreadSessions[customerId] > 0 && (
                    <span style={{
                      background: '#B85042',
                      color: 'white',
                      borderRadius: '50%',
                      padding: '2px 6px',
                      fontSize: '0.72rem',
                      fontWeight: 'bold',
                      marginLeft: 'auto',
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {unreadSessions[customerId]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="admin-chat-thread-card">
          <div className="admin-chat-panel-head admin-chat-thread-head">
            <div><span>Conversation</span><h2>{selectedIdentity?.displayName || 'Chọn khách hàng'}</h2></div>
            <span className={`admin-chat-live-pill ${connection.status}`}>{connection.status}</span>
          </div>
          <div className="admin-chat-thread" role="log" aria-label="Lịch sử chat khách hàng">
            {loadingHistory && <div className="admin-empty">Đang tải lịch sử...</div>}
            {!loadingHistory && !selectedCustomerId && <div className="admin-empty">Chọn một phiên chat để bắt đầu phản hồi.</div>}
            {!loadingHistory && selectedCustomerId && selectedMessages.length === 0 && <div className="admin-empty">Chưa có tin nhắn trong phiên này.</div>}
            {selectedMessages.map((message) => {
              const fromAdmin = message.senderId === ADMIN_CHAT_ID;
              return (
                <article key={message.id} className={`admin-chat-message ${fromAdmin ? 'from-admin' : 'from-customer'}`}>
                  <p>{message.content}</p>
                  <time dateTime={message.timestamp}>{new Date(message.timestamp).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</time>
                </article>
              );
            })}
            <div ref={threadEndRef} />
          </div>
          <form className="admin-chat-compose" onSubmit={handleSendMessage}>
            <label className="sr-only" htmlFor="admin-chat-input">Nội dung phản hồi</label>
            <input id="admin-chat-input" type="text" maxLength={1000} value={inputText} onChange={(event) => setInputText(event.target.value)} placeholder={selectedIdentity ? `Trả lời ${selectedIdentity.displayName}...` : 'Chọn khách hàng để trả lời'} disabled={!selectedCustomerId} />
            <button id="admin-chat-send-button" type="submit" disabled={!inputText.trim() || !selectedCustomerId || !connection.ready}>Gửi</button>
          </form>
        </div>

        <aside className="admin-chat-profile" aria-label="Hồ sơ khách hàng đang chọn">
          <div className="admin-chat-panel-head"><div><span>Customer profile</span><h2>Thông tin khách hàng</h2></div></div>
          {!selectedIdentity && <div className="admin-chat-profile-empty">Chọn một hội thoại để xem hồ sơ.</div>}
          {selectedIdentity && (
            <div className="admin-chat-profile-body">
              <div className="admin-chat-profile-hero">
                <span className={`admin-chat-profile-avatar ${onlineUsers[selectedCustomerId] ? 'online' : ''}`} aria-hidden="true">{selectedIdentity.displayName.slice(0, 2).toUpperCase()}</span>
                <div>
                  <h3>{selectedIdentity.displayName}</h3>
                  <p>{selectedIdentity.kind === 'registered' ? `@${selectedIdentity.accountName || selectedIdentity.sessionId}` : selectedIdentity.kind === 'guest' ? 'Phiên khách vãng lai' : 'Hồ sơ không khả dụng'}</p>
                </div>
              </div>

              {customerProfiles[selectedCustomerId]?.status === 'loading' && <div className="admin-chat-profile-state">Đang tải dữ liệu từ user-service...</div>}
              {customerProfiles[selectedCustomerId]?.status === 'error' && <div className="admin-chat-profile-state error">{customerProfiles[selectedCustomerId].message}</div>}

              <dl className="admin-chat-profile-details">
                <div><dt>Session ID</dt><dd>{selectedIdentity.sessionId}</dd></div>
                <div><dt>Trạng thái</dt><dd>{onlineUsers[selectedCustomerId] ? 'Đang online' : 'Không có tín hiệu online'}</dd></div>
                {selectedIdentity.email && <div><dt>Email</dt><dd>{selectedIdentity.email}</dd></div>}
                {selectedIdentity.phoneNumber && <div><dt>Điện thoại</dt><dd>{selectedIdentity.phoneNumber}</dd></div>}
                {selectedIdentity.location && <div><dt>Khu vực</dt><dd>{selectedIdentity.location}</dd></div>}
                {selectedIdentity.role && <div><dt>Vai trò</dt><dd>{selectedIdentity.role}</dd></div>}
                {selectedIdentity.active != null && <div><dt>Tài khoản</dt><dd>{Number(selectedIdentity.active) === 0 ? 'Đã khóa' : 'Đang hoạt động'}</dd></div>}
              </dl>
              <p className="admin-chat-profile-note">Thông tin hiển thị trực tiếp từ user-service. Không bổ sung dữ liệu suy đoán.</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
