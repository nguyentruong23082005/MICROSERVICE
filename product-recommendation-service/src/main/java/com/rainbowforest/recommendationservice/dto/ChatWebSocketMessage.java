package com.rainbowforest.recommendationservice.dto;

import java.time.Instant;

public class ChatWebSocketMessage {

    private String type;
    private String senderId;
    private String receiverId;
    private String content;
    private String status;
    private Instant timestamp;

    public ChatWebSocketMessage() {
    }

    public static ChatWebSocketMessage error(String content) {
        ChatWebSocketMessage message = new ChatWebSocketMessage();
        message.setType("ERROR");
        message.setContent(content);
        message.setTimestamp(Instant.now());
        return message;
    }

    public static ChatWebSocketMessage status(String senderId, String status) {
        ChatWebSocketMessage message = new ChatWebSocketMessage();
        message.setType("STATUS");
        message.setSenderId(senderId);
        message.setStatus(status);
        message.setTimestamp(Instant.now());
        return message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(String receiverId) {
        this.receiverId = receiverId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
