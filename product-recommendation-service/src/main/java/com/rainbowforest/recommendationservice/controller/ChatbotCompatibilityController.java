package com.rainbowforest.recommendationservice.controller;

import com.rainbowforest.recommendationservice.dto.ApiEnvelope;
import com.rainbowforest.recommendationservice.dto.ChatRequest;
import com.rainbowforest.recommendationservice.dto.ChatResponse;
import com.rainbowforest.recommendationservice.dto.ChatbotReplyPayload;
import com.rainbowforest.recommendationservice.dto.ChatbotSendRequest;
import com.rainbowforest.recommendationservice.dto.ChatbotSendResponse;
import com.rainbowforest.recommendationservice.service.ChatbotService;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chatbot")
public class ChatbotCompatibilityController {

    private final ChatbotService chatbotService;

    public ChatbotCompatibilityController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/send")
    public ResponseEntity<ApiEnvelope<ChatbotSendResponse>> send(@RequestBody ChatbotSendRequest request) {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiEnvelope.error("Message is required."));
        }

        ChatResponse chatResponse = chatbotService.chat(new ChatRequest(request.getMessage(), Collections.emptyList()));
        String sessionId = request.getSessionId() == null || request.getSessionId().isBlank()
                ? UUID.randomUUID().toString()
                : request.getSessionId();
        ChatbotReplyPayload reply = new ChatbotReplyPayload(
                chatResponse.getResponse(),
                chatResponse.getSuggestedProducts() == null ? Collections.emptyList() : chatResponse.getSuggestedProducts(),
                Collections.emptyList()
        );
        return ResponseEntity.ok(ApiEnvelope.ok(new ChatbotSendResponse(sessionId, reply, chatResponse.isMockMode())));
    }

    @GetMapping("/history/{sessionId}")
    public ResponseEntity<ApiEnvelope<Object>> history(@PathVariable String sessionId) {
        return ResponseEntity.ok(ApiEnvelope.ok(Collections.emptyList()));
    }
}
