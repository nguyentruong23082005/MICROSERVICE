package com.rainbowforest.recommendationservice.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class FeignClientInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();

            String authHeader = request.getHeader("Authorization");
            if (authHeader != null) {
                template.header("Authorization", authHeader);
            }

            String xUserId = request.getHeader("X-User-Id");
            if (xUserId != null) {
                template.header("X-User-Id", xUserId);
            }

            String xUserRoles = request.getHeader("X-User-Roles");
            if (xUserRoles != null) {
                template.header("X-User-Roles", xUserRoles);
            }
        }
    }
}
