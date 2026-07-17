package com.rainbowforest.userservice.config;

import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.entity.UserRole;
import com.rainbowforest.userservice.service.JwtTokenService;
import com.rainbowforest.userservice.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties =
        "security.jwt.secret=unit-test-only-secret-value-32-bytes")
@AutoConfigureMockMvc
class ServiceAuthorizationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenService jwtTokenService;

    @MockBean
    private UserService userService;

    @Test
    void admin_endpoint_should_reject_anonymous_requests() throws Exception {
        mockMvc.perform(get("/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void admin_endpoint_should_not_trust_raw_forwarded_identity_headers() throws Exception {
        mockMvc.perform(get("/admin/users")
                        .header("X-User-Id", "99")
                        .header("X-User-Roles", "ROLE_ADMIN"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void admin_endpoint_should_reject_authenticated_non_admin_users() throws Exception {
        String token = tokenFor(7L, "customer", "ROLE_USER");

        mockMvc.perform(get("/admin/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_endpoint_should_allow_authenticated_admin_users() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of());
        String token = tokenFor(1L, "admin", "ROLE_ADMIN");

        mockMvc.perform(get("/admin/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void registration_endpoint_should_remain_public() throws Exception {
        mockMvc.perform(post("/auth/registration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    private String tokenFor(Long id, String userName, String roleName) {
        UserRole role = new UserRole();
        role.setRoleName(roleName);

        User user = new User();
        user.setId(id);
        user.setUserName(userName);
        user.setRole(role);
        return jwtTokenService.generateToken(user);
    }
}

