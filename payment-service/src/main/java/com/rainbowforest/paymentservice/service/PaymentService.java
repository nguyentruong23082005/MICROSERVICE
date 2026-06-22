package com.rainbowforest.paymentservice.service;

import com.rainbowforest.paymentservice.domain.Payment;
import com.rainbowforest.paymentservice.dto.RevenueStatisticsResponse;
import com.rainbowforest.paymentservice.event.OrderCreatedEvent;
import com.rainbowforest.paymentservice.event.PaymentCompletedEvent;
import com.rainbowforest.paymentservice.event.PaymentFailedEvent;
import com.rainbowforest.paymentservice.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String paymentCompletedTopic;
    private final String paymentFailedTopic;

    private static final DateTimeFormatter DAY_FMT   = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    public PaymentService(PaymentRepository paymentRepository,
                          KafkaTemplate<String, Object> kafkaTemplate,
                          @Value("${app.kafka.topics.payment-completed:payment-completed}") String paymentCompletedTopic,
                          @Value("${app.kafka.topics.payment-failed:payment-failed}") String paymentFailedTopic) {
        this.paymentRepository = paymentRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.paymentCompletedTopic = paymentCompletedTopic;
        this.paymentFailedTopic = paymentFailedTopic;
    }

    /**
     * Xử lý thanh toán theo Saga.
     * forceFailure=true → giả lập thanh toán thất bại (demo mục đích).
     */
    @CacheEvict(value = "revenue", allEntries = true)
    public Payment processPayment(OrderCreatedEvent event) {
        boolean forceFailure = Boolean.TRUE.equals(event.getForceFailure());

        Payment payment = new Payment();
        payment.setOrderId(event.getOrderId());
        payment.setUserId(event.getUserId());
        payment.setAmount(event.getTotal());
        payment.setPaidAt(LocalDateTime.now());

        if (forceFailure) {
            payment.setStatus("FAILED");
            Payment saved = paymentRepository.save(payment);
            publishFailedEvent(saved, "Force failure requested by caller");
            return saved;
        }

        payment.setStatus("COMPLETED");
        Payment saved = paymentRepository.save(payment);
        publishCompletedEvent(saved);
        return saved;
    }

    /** Thống kê doanh thu — kết quả được cache Redis 5 phút */
    @Cacheable(value = "revenue", key = "'stats'")
    public RevenueStatisticsResponse getRevenueStatistics() {
        BigDecimal total = paymentRepository.sumCompletedRevenue();
        long count = paymentRepository.countCompletedOrders();
        List<Payment> completed = paymentRepository.findAllCompleted();

        Map<String, BigDecimal> daily = completed.stream().collect(
                Collectors.groupingBy(
                        p -> p.getPaidAt().format(DAY_FMT),
                        TreeMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)
                )
        );

        Map<String, BigDecimal> monthly = completed.stream().collect(
                Collectors.groupingBy(
                        p -> p.getPaidAt().format(MONTH_FMT),
                        TreeMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)
                )
        );

        return new RevenueStatisticsResponse(total, count, daily, monthly);
    }

    public List<Payment> getPaymentsByOrderId(Long orderId) {
        return paymentRepository.findAllByOrderId(orderId);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private void publishCompletedEvent(Payment payment) {
        PaymentCompletedEvent event = new PaymentCompletedEvent(
                payment.getId(), payment.getOrderId(), payment.getUserId(),
                payment.getAmount(), payment.getStatus(), payment.getPaidAt());
        kafkaTemplate.send(paymentCompletedTopic, String.valueOf(payment.getOrderId()), event);
    }

    private void publishFailedEvent(Payment payment, String reason) {
        PaymentFailedEvent event = new PaymentFailedEvent(
                payment.getId(), payment.getOrderId(), payment.getUserId(),
                payment.getAmount(), reason, payment.getPaidAt());
        kafkaTemplate.send(paymentFailedTopic, String.valueOf(payment.getOrderId()), event);
    }
}
