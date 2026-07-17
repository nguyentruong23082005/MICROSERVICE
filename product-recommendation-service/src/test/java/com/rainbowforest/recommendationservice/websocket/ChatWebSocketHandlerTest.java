package com.rainbowforest.recommendationservice.websocket;

import com.rainbowforest.recommendationservice.model.SupportMessage;
import com.rainbowforest.recommendationservice.repository.SupportMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.net.URI;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChatWebSocketHandlerTest {

    private SupportMessageRepository messageRepository;
    private StringRedisTemplate redisTemplate;
    private ChatWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        messageRepository = mock(SupportMessageRepository.class);
        redisTemplate = mock(StringRedisTemplate.class);
        handler = new ChatWebSocketHandler(messageRepository, redisTemplate);
    }

    @Test
    void handleTextMessageOverridesSpoofedSenderIdFromSessionAttribute() throws Exception {
        when(messageRepository.save(any(SupportMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        TestSession session = new TestSession("session-1", Map.of("userId", "user_7", "isAdmin", false));
        handler.afterConnectionEstablished(session);

        handler.handleTextMessage(session, new TextMessage("{\"senderId\":\"admin\",\"receiverId\":\"admin\",\"content\":\"hello\"}"));

        verify(messageRepository).save(any(SupportMessage.class));
        verify(redisTemplate).convertAndSend(
                eq(ChatWebSocketHandler.CHANNEL),
                org.mockito.ArgumentMatchers.argThat((String payload) ->
                        payload.contains("\"type\":\"CHAT\"")
                                && payload.contains("\"senderId\":\"user_7\"")
                                && payload.contains("\"receiverId\":\"admin\"")
                )
        );
    }

    @Test
    void handleTextMessageRejectsNonAdminReceiverSpoofing() throws Exception {
        TestSession session = new TestSession("session-1", Map.of("userId", "user_7", "isAdmin", false));
        handler.afterConnectionEstablished(session);

        handler.handleTextMessage(session, new TextMessage("{\"receiverId\":\"user_8\",\"content\":\"hello\"}"));

        verify(messageRepository, times(0)).save(any(SupportMessage.class));
        assertThat(session.sentPayloads()).anyMatch(payload -> payload.contains("chỉ có thể gửi cho quản trị viên"));
    }

    @Test
    void handleTextMessageRejectsMessagesOverOneThousandCharacters() throws Exception {
        TestSession session = new TestSession("session-1", Map.of("userId", "user_7", "isAdmin", false));
        handler.afterConnectionEstablished(session);
        String longContent = "a".repeat(1001);

        handler.handleTextMessage(session, new TextMessage("{\"receiverId\":\"admin\",\"content\":\"" + longContent + "\"}"));

        verify(messageRepository, times(0)).save(any(SupportMessage.class));
        assertThat(session.sentPayloads()).anyMatch(payload -> payload.contains("1000"));
    }

    @Test
    void handleTextMessageRateLimitsSixthMessageWithinOneSecond() throws Exception {
        when(messageRepository.save(any(SupportMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        TestSession session = new TestSession("session-1", Map.of("userId", "user_7", "isAdmin", false));
        handler.afterConnectionEstablished(session);

        for (int i = 0; i < 6; i++) {
            handler.handleTextMessage(session, new TextMessage("{\"receiverId\":\"admin\",\"content\":\"hello " + i + "\"}"));
        }

        verify(messageRepository, times(5)).save(any(SupportMessage.class));
        assertThat(session.sentPayloads()).anyMatch(payload -> payload.contains("Giới hạn 5 tin"));
    }

    @Test
    void afterConnectionClosedUsesReferenceCountingForUserSessions() throws Exception {
        TestSession first = new TestSession("session-1", Map.of("userId", "user_7", "isAdmin", false));
        TestSession second = new TestSession("session-2", Map.of("userId", "user_7", "isAdmin", false));

        handler.afterConnectionEstablished(first);
        handler.afterConnectionEstablished(second);
        assertThat(handler.sessionCount("user_7")).isEqualTo(2);

        handler.afterConnectionClosed(first, org.springframework.web.socket.CloseStatus.NORMAL);
        assertThat(handler.sessionCount("user_7")).isEqualTo(1);

        handler.afterConnectionClosed(second, org.springframework.web.socket.CloseStatus.NORMAL);
        assertThat(handler.sessionCount("user_7")).isZero();
    }

    @Test
    void deliverFromRedisRemovesSessionThatClosesDuringSend() {
        TestSession session = new TestSession("session-1", Map.of("userId", "user_7", "isAdmin", false));
        handler.afterConnectionEstablished(session);
        session.failNextSend();

        handler.deliverFromRedis("{\"type\":\"CHAT\",\"senderId\":\"admin\",\"receiverId\":\"user_7\",\"content\":\"hello\"}");

        assertThat(handler.sessionCount("user_7")).isZero();
    }

    private static final class TestSession implements WebSocketSession {
        private final String id;
        private final Map<String, Object> attributes = new HashMap<>();
        private final java.util.List<String> sentPayloads = new java.util.ArrayList<>();
        private boolean open = true;
        private boolean failNextSendWithClosedSession;

        private TestSession(String id, Map<String, Object> attributes) {
            this.id = id;
            this.attributes.putAll(attributes);
        }

        List<String> sentPayloads() {
            return List.copyOf(sentPayloads);
        }

        void failNextSend() {
            failNextSendWithClosedSession = true;
        }

        @Override
        public String getId() {
            return id;
        }

        @Override
        public URI getUri() {
            return URI.create("ws://localhost/ws/support-chat");
        }

        @Override
        public org.springframework.http.HttpHeaders getHandshakeHeaders() {
            return new org.springframework.http.HttpHeaders();
        }

        @Override
        public Map<String, Object> getAttributes() {
            return attributes;
        }

        @Override
        public Principal getPrincipal() {
            return null;
        }

        @Override
        public java.net.InetSocketAddress getLocalAddress() {
            return null;
        }

        @Override
        public java.net.InetSocketAddress getRemoteAddress() {
            return null;
        }

        @Override
        public String getAcceptedProtocol() {
            return null;
        }

        @Override
        public void setTextMessageSizeLimit(int messageSizeLimit) {
        }

        @Override
        public int getTextMessageSizeLimit() {
            return 8192;
        }

        @Override
        public void setBinaryMessageSizeLimit(int messageSizeLimit) {
        }

        @Override
        public int getBinaryMessageSizeLimit() {
            return 8192;
        }

        @Override
        public java.util.List<org.springframework.web.socket.WebSocketExtension> getExtensions() {
            return List.of();
        }

        @Override
        public void sendMessage(org.springframework.web.socket.WebSocketMessage<?> message) {
            if (failNextSendWithClosedSession) {
                failNextSendWithClosedSession = false;
                open = false;
                throw new IllegalStateException("Message will not be sent because the WebSocket session has been closed");
            }
            sentPayloads.add(String.valueOf(message.getPayload()));
        }

        @Override
        public boolean isOpen() {
            return open;
        }

        @Override
        public void close() {
            open = false;
        }

        @Override
        public void close(org.springframework.web.socket.CloseStatus status) {
            open = false;
        }
    }
}
