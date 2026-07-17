package com.rainbowforest.recommendationservice.controller;

import com.rainbowforest.recommendationservice.dto.ChatRequest;
import com.rainbowforest.recommendationservice.dto.ChatResponse;
import com.rainbowforest.recommendationservice.service.ChatbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chat")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        ChatResponse response = chatbotService.chat(request);
        return ResponseEntity.ok(response);
    }
}
