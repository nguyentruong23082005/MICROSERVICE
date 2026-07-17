package com.rainbowforest.recommendationservice.dto;

import java.util.List;

public class ChatRequest {
    private String message;
    private List<ChatMessage> history;

    public ChatRequest() {}

    public ChatRequest(String message, List<ChatMessage> history) {
        this.message = message;
        this.history = history;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<ChatMessage> getHistory() {
        return history;
    }

    public void setHistory(List<ChatMessage> history) {
        this.history = history;
    }
}
