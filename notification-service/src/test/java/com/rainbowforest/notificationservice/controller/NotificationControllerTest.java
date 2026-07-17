package com.rainbowforest.notificationservice.controller;

import com.rainbowforest.notificationservice.domain.Notification;
import com.rainbowforest.notificationservice.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NotificationControllerTest {

    private NotificationService notificationService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        notificationService = mock(NotificationService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new NotificationController(notificationService)).build();
    }

    @Test
    void getUnreadCount_returnsUserScopedCount() throws Exception {
        when(notificationService.countUnreadNotifications(42L)).thenReturn(3L);

        mockMvc.perform(get("/notifications/user/42/unread-count")
                        .header("X-User-Id", "42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(3));

        verify(notificationService).countUnreadNotifications(42L);
    }

    @Test
    void getUnreadCount_rejectsMissingIdentity() throws Exception {
        mockMvc.perform(get("/notifications/user/42/unread-count"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(notificationService);
    }

    @Test
    void getUnreadCount_rejectsAnotherUsersPath() throws Exception {
        mockMvc.perform(get("/notifications/user/7/unread-count")
                        .header("X-User-Id", "42"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(notificationService);
    }

    @Test
    void markAsRead_usesAuthenticatedUserIdentity() throws Exception {
        Notification updated = new Notification();
        updated.setId("notification-1");
        updated.setUserId(42L);
        updated.setRead(true);
        when(notificationService.markAsRead("notification-1", 42L, false)).thenReturn(updated);

        mockMvc.perform(patch("/notifications/notification-1/read")
                        .header("X-User-Id", "42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("notification-1"))
                .andExpect(jsonPath("$.read").value(true));

        verify(notificationService).markAsRead("notification-1", 42L, false);
    }

    @Test
    void markAsRead_passesAdminAuthorizationFromExactRole() throws Exception {
        Notification updated = new Notification();
        updated.setId("admin-notification");
        updated.setType("ADMIN");
        updated.setRead(true);
        when(notificationService.markAsRead("admin-notification", 42L, true)).thenReturn(updated);

        mockMvc.perform(patch("/notifications/admin-notification/read")
                        .header("X-User-Id", "42")
                        .header("X-User-Roles", "ROLE_USER, ROLE_ADMIN"))
                .andExpect(status().isOk());

        verify(notificationService).markAsRead("admin-notification", 42L, true);
    }

    @Test
    void markAsRead_doesNotTreatSimilarRoleAsAdmin() throws Exception {
        Notification updated = new Notification();
        updated.setId("notification-1");
        updated.setRead(true);
        when(notificationService.markAsRead("notification-1", 42L, false)).thenReturn(updated);

        mockMvc.perform(patch("/notifications/notification-1/read")
                        .header("X-User-Id", "42")
                        .header("X-User-Roles", "ROLE_SUPER_ADMIN"))
                .andExpect(status().isOk());

        verify(notificationService).markAsRead("notification-1", 42L, false);
    }
}