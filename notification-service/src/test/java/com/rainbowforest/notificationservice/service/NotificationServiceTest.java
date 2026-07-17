package com.rainbowforest.notificationservice.service;

import com.rainbowforest.notificationservice.domain.Notification;
import com.rainbowforest.notificationservice.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Test
    void countUnreadNotifications_usesUserScopedUnreadQuery() {
        NotificationService service = new NotificationService(notificationRepository);
        when(notificationRepository.countByUserIdAndReadFalse(42L)).thenReturn(3L);

        long count = service.countUnreadNotifications(42L);

        assertEquals(3L, count);
    }

    @Test
    void markAsRead_persistsANewReadCopyWithoutMutatingTheExistingNotification() {
        Notification existing = new Notification();
        existing.setId("notification-1");
        existing.setUserId(42L);
        existing.setMessage("Order confirmed");
        existing.setRead(false);
        when(notificationRepository.findById("notification-1")).thenReturn(Optional.of(existing));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        NotificationService service = new NotificationService(notificationRepository);

        Notification updated = service.markAsRead("notification-1", 42L);

        assertNotSame(existing, updated);
        assertFalse(existing.isRead());
        assertTrue(updated.isRead());
        verify(notificationRepository).save(updated);
    }

    @Test
    void markAsRead_rejectsUnknownNotification() {
        when(notificationRepository.findById("missing")).thenReturn(Optional.empty());
        NotificationService service = new NotificationService(notificationRepository);

        assertThrows(IllegalArgumentException.class, () -> service.markAsRead("missing", 42L));
    }

    @Test
    void markAsRead_rejectsNotificationOwnedByAnotherUser() {
        Notification existing = new Notification();
        existing.setId("notification-1");
        existing.setUserId(7L);
        when(notificationRepository.findById("notification-1")).thenReturn(Optional.of(existing));
        NotificationService service = new NotificationService(notificationRepository);

        assertThrows(IllegalArgumentException.class, () -> service.markAsRead("notification-1", 42L));

        org.mockito.Mockito.verify(notificationRepository, org.mockito.Mockito.never())
                .save(any(Notification.class));
    }
    @Test
    void markAsRead_allowsAdminToReadAdminNotification() {
        Notification existing = new Notification();
        existing.setId("admin-notification");
        existing.setType("ADMIN");
        existing.setRead(false);
        when(notificationRepository.findById("admin-notification")).thenReturn(Optional.of(existing));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        NotificationService service = new NotificationService(notificationRepository);

        Notification updated = service.markAsRead("admin-notification", 42L, true);

        assertTrue(updated.isRead());
        assertFalse(existing.isRead());
        verify(notificationRepository).save(updated);
    }

    @Test
    void markAsRead_rejectsAdminNotificationForOrdinaryUser() {
        Notification existing = new Notification();
        existing.setId("admin-notification");
        existing.setType("ADMIN");
        when(notificationRepository.findById("admin-notification")).thenReturn(Optional.of(existing));
        NotificationService service = new NotificationService(notificationRepository);

        assertThrows(IllegalArgumentException.class,
                () -> service.markAsRead("admin-notification", 42L, false));

        org.mockito.Mockito.verify(notificationRepository, org.mockito.Mockito.never())
                .save(any(Notification.class));
    }
}