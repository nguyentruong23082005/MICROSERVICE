package com.rainbowforest.recommendationservice.websocket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import java.nio.charset.StandardCharsets;

@Configuration
public class SupportChatRedisConfig {

    @Bean
    public RedisMessageListenerContainer supportChatRedisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            ChatWebSocketHandler chatWebSocketHandler) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        MessageListener listener = (message, pattern) -> chatWebSocketHandler.deliverFromRedis(
                new String(message.getBody(), StandardCharsets.UTF_8)
        );
        container.addMessageListener(listener, new ChannelTopic(ChatWebSocketHandler.CHANNEL));
        return container;
    }
}
