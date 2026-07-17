package com.rainbowforest.recommendationservice.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rainbowforest.recommendationservice.dto.ChatWebSocketMessage;
import com.rainbowforest.recommendationservice.model.SupportMessage;
import com.rainbowforest.recommendationservice.repository.SupportMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    public static final String CHANNEL = "support-chat:messages";
    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);
    private static final int MAX_MESSAGE_LENGTH = 1000;
    private static final int MAX_MESSAGES_PER_SECOND = 5;
    private static final long RATE_WINDOW_MILLIS = 1000L;

    private final ConcurrentHashMap<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final SupportMessageRepository messageRepository;
    private final StringRedisTemplate redisTemplate;

    public ChatWebSocketHandler(SupportMessageRepository messageRepository, StringRedisTemplate redisTemplate) {
        this.messageRepository = messageRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userId = currentUserId(session);
        if (userId == null) {
            closeQuietly(session, CloseStatus.POLICY_VIOLATION);
            return;
        }

        session.getAttributes().put("timestamps", new ConcurrentLinkedQueue<Long>());
        userSessions.compute(userId, (key, sessions) -> {
            Set<WebSocketSession> updated = sessions == null ? ConcurrentHashMap.newKeySet() : sessions;
            updated.add(session);
            if (updated.size() == 1) {
                publishStatus(userId, "ONLINE");
            }
            return updated;
        });
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String senderId = currentUserId(session);
        if (senderId == null) {
            sendError(session, "Chưa được xác thực kết nối.");
            return;
        }
        if (isRateLimited(session)) {
            sendError(session, "Gửi tin nhắn quá nhanh. Giới hạn 5 tin/giây.");
            return;
        }

        ChatWebSocketMessage payload;
        try {
            payload = objectMapper.readValue(message.getPayload(), ChatWebSocketMessage.class);
        } catch (Exception ex) {
            sendError(session, "Định dạng tin nhắn không hợp lệ.");
            return;
        }

        String receiverId = sanitizeIdentifier(payload.getReceiverId());
        String content = payload.getContent() == null ? "" : payload.getContent().trim();
        if (receiverId == null) {
            sendError(session, "Thiếu người nhận tin nhắn.");
            return;
        }
        boolean isAdmin = Boolean.TRUE.equals(session.getAttributes().get("isAdmin"));
        if (!isAdmin && !"admin".equals(receiverId)) {
            sendError(session, "Khách hàng chỉ có thể gửi cho quản trị viên.");
            return;
        }
        if (content.isBlank()) {
            sendError(session, "Nội dung tin nhắn không được để trống.");
            return;
        }
        if (content.length() > MAX_MESSAGE_LENGTH) {
            sendError(session, "Tin nhắn vượt quá giới hạn 1000 ký tự.");
            return;
        }

        ChatWebSocketMessage safeMessage = new ChatWebSocketMessage();
        safeMessage.setType("CHAT");
        safeMessage.setSenderId(senderId);
        safeMessage.setReceiverId(receiverId);
        safeMessage.setContent(content);
        safeMessage.setTimestamp(Instant.now());

        String customerId = resolveCustomerId(senderId, receiverId, session);
        messageRepository.save(new SupportMessage(senderId, receiverId, customerId, content));
        publishChat(safeMessage);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String userId = currentUserId(session);
        if (userId != null) {
            removeSession(userId, session);
        }
    }

    private void removeSession(String userId, WebSocketSession session) {
        userSessions.computeIfPresent(userId, (key, sessions) -> {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                publishStatus(userId, "OFFLINE");
                return null;
            }
            return sessions;
        });
    }

    public void deliverFromRedis(String payload) {
        try {
            ChatWebSocketMessage message = objectMapper.readValue(payload, ChatWebSocketMessage.class);
            deliver(message);
        } catch (Exception ex) {
            log.warn("Failed to deliver Redis support chat payload", ex);
        }
    }

    int sessionCount(String userId) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        return sessions == null ? 0 : sessions.size();
    }

    private void publishChat(ChatWebSocketMessage message) throws Exception {
        String payload = objectMapper.writeValueAsString(message);
        try {
            redisTemplate.convertAndSend(CHANNEL, payload);
        } catch (Exception ex) {
            log.warn("Redis Pub/Sub unavailable; delivering support chat locally", ex);
            deliver(message);
        }
    }

    private void publishStatus(String userId, String status) {
        try {
            redisTemplate.convertAndSend(CHANNEL, objectMapper.writeValueAsString(ChatWebSocketMessage.status(userId, status)));
        } catch (Exception ex) {
            log.warn("Redis Pub/Sub unavailable for status update; delivering locally", ex);
            deliver(ChatWebSocketMessage.status(userId, status));
        }
    }

    private void deliver(ChatWebSocketMessage message) {
        if ("STATUS".equals(message.getType())) {
            userSessions.keySet().forEach(userId -> sendToUser(userId, message));
            return;
        }
        sendToUser(message.getSenderId(), message);
        sendToUser(message.getReceiverId(), message);
    }

    private void sendToUser(String userId, ChatWebSocketMessage message) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null) {
            return;
        }
        sessions.forEach(session -> {
            if (!sendQuietly(session, message)) {
                removeSession(userId, session);
            }
        });
    }

    private boolean sendQuietly(WebSocketSession session, ChatWebSocketMessage message) {
        if (!session.isOpen()) {
            return false;
        }
        try {
            synchronized (session) {
                if (!session.isOpen()) {
                    return false;
                }
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            }
            return true;
        } catch (IOException | IllegalStateException ex) {
            log.debug("Removing closed support chat WebSocket session after send failure: {}", session.getId());
            return false;
        }
    }

    private void sendError(WebSocketSession session, String content) throws IOException {
        synchronized (session) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ChatWebSocketMessage.error(content))));
        }
    }

    private boolean isRateLimited(WebSocketSession session) {
        Map<String, Object> attributes = session.getAttributes();
        @SuppressWarnings("unchecked")
        ConcurrentLinkedQueue<Long> timestamps = (ConcurrentLinkedQueue<Long>) attributes.computeIfAbsent(
                "timestamps",
                key -> new ConcurrentLinkedQueue<Long>()
        );
        long now = System.currentTimeMillis();
        Long oldest = timestamps.peek();
        while (oldest != null && now - oldest > RATE_WINDOW_MILLIS) {
            timestamps.poll();
            oldest = timestamps.peek();
        }
        if (timestamps.size() >= MAX_MESSAGES_PER_SECOND) {
            return true;
        }
        timestamps.add(now);
        return false;
    }

    private String resolveCustomerId(String senderId, String receiverId, WebSocketSession session) {
        boolean isAdmin = Boolean.TRUE.equals(session.getAttributes().get("isAdmin"));
        return isAdmin ? receiverId : senderId;
    }

    private String currentUserId(WebSocketSession session) {
        Object value = session.getAttributes().get("userId");
        return value instanceof String text && !text.isBlank() ? text : null;
    }

    private String sanitizeIdentifier(String value) {
        if (value == null || value.isBlank() || value.length() > 120) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.matches("^[A-Za-z0-9_@.-]+$") ? trimmed : null;
    }

    private void closeQuietly(WebSocketSession session, CloseStatus status) {
        try {
            session.close(status);
        } catch (IOException ex) {
            log.debug("Failed to close unauthenticated support chat session", ex);
        }
    }
}
