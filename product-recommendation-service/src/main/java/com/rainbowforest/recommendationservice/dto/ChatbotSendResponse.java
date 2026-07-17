package com.rainbowforest.recommendationservice.dto;

public class ChatbotSendResponse {
    private String sessionId;
    private ChatbotReplyPayload response;
    private boolean mockMode;

    public ChatbotSendResponse() {}

    public ChatbotSendResponse(String sessionId, ChatbotReplyPayload response, boolean mockMode) {
        this.sessionId = sessionId;
        this.response = response;
        this.mockMode = mockMode;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public ChatbotReplyPayload getResponse() {
        return response;
    }

    public void setResponse(ChatbotReplyPayload response) {
        this.response = response;
    }

    public boolean isMockMode() {
        return mockMode;
    }

    public void setMockMode(boolean mockMode) {
        this.mockMode = mockMode;
    }
}
