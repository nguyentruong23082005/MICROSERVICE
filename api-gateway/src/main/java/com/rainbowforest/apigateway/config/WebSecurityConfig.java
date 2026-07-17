package com.rainbowforest.apigateway.config;

import com.rainbowforest.apigateway.filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class WebSecurityConfig {

    private final List<String> allowedOriginPatterns;

    public WebSecurityConfig(
            @Value("${app.cors.allowed-origin-patterns}") List<String> allowedOriginPatterns) {
        this.allowedOriginPatterns = List.copyOf(allowedOriginPatterns);
    }

    static final String[] PUBLIC_GET_PATHS = {
            "/api/catalog/products",
            "/api/catalog/products/**",
            "/api/catalog/categories",
            "/api/catalog/categories/**",
            "/api/catalog/content-pages",
            "/api/catalog/content-pages/**",
            "/api/catalog/uploads",
            "/api/catalog/uploads/**",
            "/api/review/reviews",
            "/api/review/reviews/**",
            "/api/review/recommendations",
            "/api/review/recommendations/**"
    };

    static final String[] PUBLIC_API_PATHS = {
            "/api/chat",
            "/api/chat/**",
            "/api/chatbot",
            "/api/chatbot/send",
            "/api/chatbot/**",
            "/api/support-chat",
            "/api/support-chat/send",
            "/api/support-chat/history",
            "/api/support-chat/history/**",
            "/api/support-chat/**",
            "/api/shipping",
            "/api/shipping/**"
    };

    static final String[] PUBLIC_WEBSOCKET_PATHS = {
            "/ws/support-chat",
            "/ws/support-chat/**"
    };

    static final String[] ADMIN_PATHS = {
            "/api/catalog/admin/**",
            "/api/shop/admin/**",
            "/api/shop/orders",
            "/api/shop/order/*/status",
            "/api/accounts/admin/**",
            "/api/notifications/admin"
    };

    static final String[] ADMIN_PAYMENT_PATHS = {
            "/api/payments",
            "/api/payments/revenue"
    };

    static List<String> publicGetPaths() {
        return Arrays.asList(PUBLIC_GET_PATHS);
    }

    static List<String> publicApiPaths() {
        return Arrays.asList(PUBLIC_API_PATHS);
    }

    static List<String> publicWebSocketPaths() {
        return Arrays.asList(PUBLIC_WEBSOCKET_PATHS);
    }

    static List<String> adminPaths() {
        return Arrays.asList(ADMIN_PATHS);
    }

    static List<String> adminPaymentPaths() {
        return Arrays.asList(ADMIN_PAYMENT_PATHS);
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http,
                                                          JwtAuthenticationFilter jwtAuthenticationFilter,
                                                          UrlBasedCorsConfigurationSource corsConfigurationSource) {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new org.springframework.security.web.server.authentication.HttpStatusServerEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED)))
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers(
                                "/api/accounts/auth/login",
                                "/api/accounts/auth/registration",
                                "/api/accounts/auth/refresh",
                                "/api/accounts/auth/firebase-login",
                                "/api/accounts/auth/forgot-password",
                                "/api/accounts/auth/reset-password",
                                "/actuator/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/webjars/**",
                                "/api/*/v3/api-docs",
                                "/api/*/v3/api-docs/**"
                        ).permitAll()
                        .pathMatchers(ADMIN_PATHS).hasAuthority("ROLE_ADMIN")
                        .pathMatchers(HttpMethod.GET, ADMIN_PAYMENT_PATHS).hasAuthority("ROLE_ADMIN")
                        .pathMatchers(HttpMethod.PUT, "/api/review/reviews/*/status").hasAuthority("ROLE_ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/api/review/reviews/**", "/api/review/recommendations/**").hasAuthority("ROLE_ADMIN")
                        .pathMatchers(HttpMethod.GET, PUBLIC_GET_PATHS).permitAll()
                        .pathMatchers(PUBLIC_API_PATHS).permitAll()
                        .pathMatchers(PUBLIC_WEBSOCKET_PATHS).permitAll()
                        .anyExchange().authenticated()
                )
                .addFilterAt(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                .build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowedOriginPatterns(allowedOriginPatterns);
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        corsConfig.setAllowedHeaders(Arrays.asList("*"));
        corsConfig.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        corsConfig.setAllowCredentials(true);
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return source;
    }

    @Bean
    public CorsWebFilter corsWebFilter(UrlBasedCorsConfigurationSource corsConfigurationSource) {
        return new CorsWebFilter(corsConfigurationSource);
    }
}
