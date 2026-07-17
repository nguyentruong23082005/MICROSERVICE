package com.rainbowforest.recommendationservice.controller;

import com.rainbowforest.recommendationservice.dto.ChatResponse;
import com.rainbowforest.recommendationservice.service.ChatbotService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@SpringBootTest
class ChatbotCompatibilityControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChatbotService chatbotService;

    @Test
    void send_should_return_reference_compatible_envelope() throws Exception {
        when(chatbotService.chat(any())).thenReturn(
                new ChatResponse("Xin chào", false, Collections.emptyList())
        );

        mockMvc.perform(post("/chatbot/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "message": "Tư vấn trà đào",
                                  "sessionId": "session-1",
                                  "imageBase64": "abc"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sessionId").value("session-1"))
                .andExpect(jsonPath("$.data.response.reply").value("Xin chào"))
                .andExpect(jsonPath("$.data.response.products").isArray())
                .andExpect(jsonPath("$.data.mockMode").value(false));

        verify(chatbotService).chat(any());
    }

    @Test
    void history_should_return_empty_list_for_now() throws Exception {
        mockMvc.perform(get("/chatbot/history/session-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
