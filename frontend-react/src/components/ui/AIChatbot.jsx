import { useEffect, useMemo, useRef, useState } from 'react';
import { post, RECOMMENDATION_SERVICE_BASE_URL } from '../../api/client.js';
import { money } from '../../utils/formatters.js';

const STORAGE_KEY = 'furniq_chat_session_id';
const MAX_MESSAGE_LENGTH = 500;
const REQUEST_TIMEOUT_MS = 10000;

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getInitialSessionId() {
  if (typeof localStorage === 'undefined') return createSessionId();
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const next = createSessionId();
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}

function extractChatbotPayload(payload) {
  const data = payload?.data || payload || {};
  const response = data.response || {};
  const reply = typeof response === 'string'
    ? response
    : response.reply || data.reply || data.responseText || 'Tôi chưa có câu trả lời phù hợp. Bạn thử hỏi cách khác nhé.';

  return {
    sessionId: data.sessionId,
    reply,
    products: Array.isArray(response.products)
      ? response.products
      : Array.isArray(data.products)
        ? data.products
        : Array.isArray(data.suggestedProducts)
          ? data.suggestedProducts
          : [],
    stores: Array.isArray(response.stores) ? response.stores : Array.isArray(data.stores) ? data.stores : [],
    mockMode: Boolean(data.mockMode),
  };
}

function getProductName(product) {
  return product.name || product.productName || 'Sản phẩm gợi ý';
}

function getProductImage(product) {
  return product.imageUrl || product.productImageUrl || product.thumbnailUrl || '';
}

function getErrorMessage(error) {
  if (error?.name === 'AbortError') return 'Phản hồi quá lâu. Vui lòng thử lại.';
  if (error?.status === 429) return 'Bạn đang gửi quá nhanh. Vui lòng chờ khoảng 1 phút rồi thử lại.';
  if (!navigator.onLine) return 'Mất kết nối. Vui lòng kiểm tra mạng và thử lại.';
  return error instanceof Error ? error.message : 'Chatbot đang gặp sự cố. Vui lòng thử lại sau.';
}

async function postChatbotDirect(data, signal) {
  const response = await fetch(`${RECOMMENDATION_SERVICE_BASE_URL}/chatbot/send`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Scope': 'customer',
    },
    body: JSON.stringify(data),
    signal,
  });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(typeof body === 'string' ? body : body?.message || `${response.status} ${response.statusText}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

async function sendChatbotMessage(data, signal) {
  try {
    return await post('/chatbot/send', data, { signal });
  } catch (error) {
    if (error?.status !== 404) throw error;
    console.warn('[AIChatbot] Gateway /api/chatbot/send returned 404. Falling back to product-recommendation-service direct endpoint.', error);
    return postChatbotDirect(data, signal);
  }
}

function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    const isBullet = line.trim().startsWith('* ');
    const cleanLine = isBullet ? line.trim().substring(2) : line;

    const parseInline = (str) => {
      const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
      const parts = str.split(regex);

      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('[') && part.includes('](')) {
          const closeBracket = part.indexOf(']');
          const linkText = part.slice(1, closeBracket);
          const linkUrl = part.slice(closeBracket + 2, -1);
          return (
            <a
              key={index}
              href={linkUrl}
              style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 650 }}
            >
              {linkText}
            </a>
          );
        }
        return part;
      });
    };

    const parsedContent = parseInline(cleanLine);

    if (isBullet) {
      return (
        <li key={lineIndex} style={{ marginLeft: '16px', listStyleType: 'disc', marginBottom: '4px' }}>
          {parsedContent}
        </li>
      );
    }

    return (
      <p key={lineIndex} style={{ margin: '0 0 10px 0', minHeight: '18px' }}>
        {parsedContent}
      </p>
    );
  });
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() => getInitialSessionId());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const lastUserMessageRef = useRef('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (selectedImage?.previewUrl) URL.revokeObjectURL(selectedImage.previewUrl);
    };
  }, [selectedImage]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages, isLoading]);

  const welcomeMessage = useMemo(() => ({
    id: 'welcome',
    role: 'bot',
    text: 'Xin chào, mình là trợ lý Furniq. Mình có thể gợi ý sofa, bàn ghế, giường tủ, đồ trang trí và hỗ trợ bạn chọn nội thất phù hợp không gian.',
    products: [],
    stores: [],
  }), []);

  const visibleMessages = messages.length > 0 ? messages : [welcomeMessage];

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Chỉ hỗ trợ đính kèm hình ảnh.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh tối đa là 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (selectedImage?.previewUrl) URL.revokeObjectURL(selectedImage.previewUrl);
      setSelectedImage({
        base64: reader.result,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      });
      setErrorMessage('');
    };
    reader.onerror = () => setErrorMessage('Không thể đọc tệp ảnh.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const sendMessage = async (messageToSend = input) => {
    let trimmedMessage = messageToSend.trim();
    if (!trimmedMessage && selectedImage) {
      trimmedMessage = 'Furniq có mẫu nội thất giống trong ảnh này không?';
    }
    if ((!trimmedMessage && !selectedImage) || isLoading) return;
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(`Tin nhắn tối đa ${MAX_MESSAGE_LENGTH} ký tự.`);
      return;
    }

    const imageToSend = selectedImage;
    setSelectedImage(null);
    lastUserMessageRef.current = trimmedMessage;
    setErrorMessage('');
    setInput('');
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmedMessage,
        imageUrl: imageToSend?.previewUrl,
        products: [],
        stores: [],
      },
    ]);
    setIsLoading(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const payload = await sendChatbotMessage({
        message: trimmedMessage,
        sessionId,
        imageBase64: imageToSend?.base64,
        imageMimeType: imageToSend?.mimeType,
      }, controller.signal);
      const chatbotPayload = extractChatbotPayload(payload);
      const nextSessionId = chatbotPayload.sessionId || sessionId;

      if (nextSessionId && nextSessionId !== sessionId) {
        if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, nextSessionId);
        setSessionId(nextSessionId);
      }

      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: chatbotPayload.reply,
          products: chatbotPayload.products,
          stores: chatbotPayload.stores,
          mockMode: chatbotPayload.mockMode,
        },
      ]);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const retryLastMessage = () => {
    if (lastUserMessageRef.current) sendMessage(lastUserMessageRef.current);
  };

  return (
    <div className="ai-chatbot-root" aria-live="polite">
      {isOpen && (
        <section className="ai-chatbot-window" aria-label="Trợ lý Furniq">
          <header className="ai-chatbot-header">
            <div className="ai-chatbot-logo" aria-hidden="true">
              <i className="bi bi-house-heart-fill" />
            </div>
            <div>
              <h2>Trợ lý Furniq</h2>
              <p>Gợi ý nội thất theo không gian</p>
            </div>
            <button id="ai-chatbot-close-button" className="ai-chatbot-close" type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chatbot">
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </header>

          <div className="ai-chatbot-messages" role="log" aria-label="Nội dung trò chuyện với trợ lý AI">
            {visibleMessages.map((message) => (
              <div key={message.id} className={`ai-chatbot-row ${message.role}`}>
                {message.role === 'bot' && <span className="ai-chatbot-avatar"><i className="bi bi-robot" aria-hidden="true" /></span>}
                <div className="ai-chatbot-stack">
                  <article className="ai-chatbot-bubble">
                    {message.imageUrl && <img className="ai-chatbot-message-image" src={message.imageUrl} alt="Đính kèm" />}
                    <div className="ai-chatbot-text-content">{renderFormattedText(message.text)}</div>
                    {message.mockMode && <small>Đang dùng chế độ dự phòng</small>}
                  </article>

                  {message.products?.length > 0 && (
                    <div className="ai-chatbot-product-list" aria-label="Sản phẩm được gợi ý">
                      {message.products.slice(0, 4).map((product) => (
                        <a className="ai-chatbot-product-card" href={`/products/${product.id}`} key={product.id || getProductName(product)}>
                          {getProductImage(product) && <img src={getProductImage(product)} alt={getProductName(product)} loading="lazy" />}
                          <span><strong>{getProductName(product)}</strong>{product.price != null && <em>{money(product.price)}</em>}</span>
                          <i className="bi bi-bag-check" aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  )}

                  {message.stores?.length > 0 && (
                    <div className="ai-chatbot-store-list" aria-label="Cửa hàng được gợi ý">
                      {message.stores.slice(0, 3).map((store) => (
                        <article className="ai-chatbot-store-card" key={store.id || store.name}>
                          <strong>{store.name}</strong>
                          <p>{store.address}</p>
                          {store.openingHours && <span>Giờ mở cửa: {store.openingHours}</span>}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-chatbot-row bot">
                <span className="ai-chatbot-avatar"><i className="bi bi-robot" aria-hidden="true" /></span>
                <div className="ai-chatbot-stack"><div className="ai-chatbot-bubble ai-chatbot-typing"><span /><span /><span /></div></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {errorMessage && (
            <div className="ai-chatbot-error" role="alert">
              <span><i className="bi bi-exclamation-circle" aria-hidden="true" /> {errorMessage}</span>
              <button type="button" onClick={retryLastMessage} disabled={isLoading}>Thử lại</button>
            </div>
          )}

          {selectedImage && (
            <div className="ai-chatbot-preview">
              <img src={selectedImage.previewUrl} alt="Preview" />
              <button type="button" onClick={() => setSelectedImage(null)} aria-label="Xóa ảnh"><i className="bi bi-x" /></button>
            </div>
          )}

          <form className="ai-chatbot-form" onSubmit={handleSubmit}>
            <div className="ai-chatbot-input-wrap">
              <button id="ai-chatbot-attach-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} aria-label="Đính kèm ảnh">
                <i className="bi bi-image" aria-hidden="true" />
              </button>
              <label className="sr-only" htmlFor="ai-chatbot-input">Nhập tin nhắn chatbot</label>
              <input
                id="ai-chatbot-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Bạn muốn tìm món nội thất nào?"
                disabled={isLoading}
              />
              <input ref={fileInputRef} type="file" onChange={handleFileChange} accept="image/*" hidden />
              <span>{input.length}/{MAX_MESSAGE_LENGTH}</span>
            </div>
            <button id="ai-chatbot-send-button" type="submit" disabled={isLoading || (input.trim().length === 0 && !selectedImage)} aria-label="Gửi tin nhắn">
              <i className="bi bi-send-fill" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button id="ai-chatbot-open-button" className="ai-chatbot-fab" type="button" onClick={() => setIsOpen((current) => !current)} aria-label="Mở chatbot Furniq">
        {isOpen ? <i className="bi bi-x-lg" aria-hidden="true" /> : <i className="bi bi-robot" aria-hidden="true" />}
      </button>
    </div>
  );
}
