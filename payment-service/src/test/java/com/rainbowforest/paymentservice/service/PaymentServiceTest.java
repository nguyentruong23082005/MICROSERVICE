package com.rainbowforest.paymentservice.service;

import com.rainbowforest.paymentservice.domain.Payment;
import com.rainbowforest.paymentservice.event.OrderCreatedEvent;
import com.rainbowforest.paymentservice.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository, kafkaTemplate, "payment-completed", "payment-failed");
    }

    @Test
    void processPayment_createsPendingIntentWithoutPublishingCompletion() {
        OrderCreatedEvent event = orderCreatedEvent(42L, 7L, "125000");
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment result = paymentService.processPayment(event);

        assertEquals("PENDING", result.getStatus());
        assertEquals(new BigDecimal("125000"), result.getAmount());
        verify(kafkaTemplate, never()).send(any(String.class), any(String.class), any());
    }

    @Test
    void getPendingGatewayIntent_returnsTrustedImmutableProjection() {
        Payment pending = pendingPayment(10L, "275000");
        when(paymentRepository.findFirstByOrderIdOrderByIdDesc(10L)).thenReturn(Optional.of(pending));

        PaymentService.GatewayPaymentIntent result = paymentService.getPendingGatewayIntent(10L);

        assertEquals(10L, result.orderId());
        assertEquals(new BigDecimal("275000"), result.amount());
        assertNotSame(pending, result);
    }

    @Test
    void getPendingGatewayIntent_rejectsNonPendingPayment() {
        Payment completed = pendingPayment(10L, "275000");
        completed.setStatus("COMPLETED");
        when(paymentRepository.findFirstByOrderIdOrderByIdDesc(10L)).thenReturn(Optional.of(completed));

        assertThrows(IllegalStateException.class, () -> paymentService.getPendingGatewayIntent(10L));
    }

    @Test
    void prepareGatewayPayment_usesPersistedOrderAmount() {
        Payment pending = pendingPayment(10L, "275000");
        when(paymentRepository.findFirstByOrderIdOrderByIdDesc(10L)).thenReturn(Optional.of(pending));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment result = paymentService.prepareGatewayPayment(10L, "VNPAY", "10_secure-ref");

        assertEquals(new BigDecimal("275000"), result.getAmount());
        assertEquals("VNPAY", result.getPaymentMethod());
        assertEquals("10_secure-ref", result.getTransactionRef());
        assertEquals("PENDING", result.getStatus());
    }

    @Test
    void processGatewayCallback_completesMatchingIntentOnlyOnce() {
        Payment pending = gatewayPayment(10L, "275000", "VNPAY", "10_secure-ref", "PENDING");
        when(paymentRepository.findByTransactionRef("10_secure-ref")).thenReturn(Optional.of(pending));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        paymentService.processGatewayCallback(10L, new BigDecimal("275000"), "VNPAY", "10_secure-ref", "COMPLETED");
        paymentService.processGatewayCallback(10L, new BigDecimal("275000"), "VNPAY", "10_secure-ref", "COMPLETED");

        assertEquals("COMPLETED", pending.getStatus());
        verify(paymentRepository, times(1)).save(pending);
        verify(kafkaTemplate, times(1)).send(
                org.mockito.ArgumentMatchers.eq("payment-completed"),
                org.mockito.ArgumentMatchers.eq("10"), any());
    }

    @Test
    void processGatewayCallback_rejectsAmountMismatch() {
        Payment pending = gatewayPayment(10L, "275000", "MOMO", "10_secure-ref", "PENDING");
        when(paymentRepository.findByTransactionRef("10_secure-ref")).thenReturn(Optional.of(pending));

        assertThrows(IllegalArgumentException.class, () -> paymentService.processGatewayCallback(
                10L, new BigDecimal("100"), "MOMO", "10_secure-ref", "COMPLETED"));

        verify(paymentRepository, never()).save(any(Payment.class));
        verify(kafkaTemplate, never()).send(any(String.class), any(String.class), any());
    }

    private OrderCreatedEvent orderCreatedEvent(Long orderId, Long userId, String total) {
        OrderCreatedEvent event = new OrderCreatedEvent();
        event.setOrderId(orderId);
        event.setUserId(userId);
        event.setTotal(new BigDecimal(total));
        return event;
    }

    private Payment pendingPayment(Long orderId, String amount) {
        Payment payment = new Payment();
        payment.setId(1L);
        payment.setOrderId(orderId);
        payment.setUserId(7L);
        payment.setAmount(new BigDecimal(amount));
        payment.setStatus("PENDING");
        return payment;
    }

    private Payment gatewayPayment(Long orderId, String amount, String method, String transactionRef, String status) {
        Payment payment = pendingPayment(orderId, amount);
        payment.setPaymentMethod(method);
        payment.setTransactionRef(transactionRef);
        payment.setStatus(status);
        return payment;
    }
}
