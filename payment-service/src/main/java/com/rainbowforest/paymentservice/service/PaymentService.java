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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

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
     * Creates the payment intent from the trusted order-created event.
     * Online payment is completed only after a verified gateway callback.
     */
    @CacheEvict(value = "revenue", allEntries = true)
    public Payment processPayment(OrderCreatedEvent event) {
        Payment payment = new Payment();
        payment.setOrderId(event.getOrderId());
        payment.setUserId(event.getUserId());
        payment.setAmount(event.getTotal());

        if (Boolean.TRUE.equals(event.getForceFailure())) {
            payment.setStatus("FAILED");
            payment.setPaidAt(LocalDateTime.now());
            Payment saved = paymentRepository.save(payment);
            publishFailedEvent(saved, "Force failure requested by caller");
            return saved;
        }

        payment.setStatus("PENDING");
        return paymentRepository.save(payment);
    }

    /**
     * Returns the trusted amount for the latest pending payment intent.
     * A projection is returned so callers cannot mutate the persisted entity.
     */
    public GatewayPaymentIntent getPendingGatewayIntent(Long orderId) {
        Payment payment = paymentRepository.findFirstByOrderIdOrderByIdDesc(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Payment intent not found for order"));
        if (!"PENDING".equals(payment.getStatus())) {
            throw new IllegalStateException("Payment intent is not pending");
        }
        if (payment.getAmount() == null || payment.getAmount().signum() <= 0) {
            throw new IllegalStateException("Payment intent has an invalid amount");
        }
        return new GatewayPaymentIntent(payment.getOrderId(), payment.getAmount());
    }

    public record GatewayPaymentIntent(Long orderId, BigDecimal amount) {}

    /**
     * Associates a gateway transaction with the latest persisted payment intent.
     * The amount is intentionally read from the database and never accepted from the client.
     */
    public Payment prepareGatewayPayment(Long orderId, String method, String transactionRef) {
        if (!"VNPAY".equals(method) && !"MOMO".equals(method)) {
            throw new IllegalArgumentException("Unsupported online payment method");
        }
        if (transactionRef == null || transactionRef.isBlank()) {
            throw new IllegalArgumentException("Transaction reference is required");
        }

        Payment payment = paymentRepository.findFirstByOrderIdOrderByIdDesc(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Payment intent not found for order"));
        if (!"PENDING".equals(payment.getStatus())) {
            throw new IllegalStateException("Payment intent is not pending");
        }

        payment.setPaymentMethod(method);
        payment.setTransactionRef(transactionRef);
        return paymentRepository.save(payment);
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

    /**
     * Processes a signature-verified gateway callback against its persisted intent.
     * The repository lookup uses a database write lock so concurrent retries are idempotent.
     */
    @CacheEvict(value = "revenue", allEntries = true)
    @org.springframework.transaction.annotation.Transactional
    public void processGatewayCallback(
            Long orderId,
            BigDecimal amount,
            String method,
            String transactionRef,
            String status) {
        Payment payment = paymentRepository.findByTransactionRef(transactionRef)
                .orElseThrow(() -> new IllegalArgumentException("Unknown payment transaction"));

        validateGatewayCallback(payment, orderId, amount, method);
        if (!"PENDING".equals(payment.getStatus())) {
            log.info("[Payment] Ignoring duplicate gateway callback for transaction {}", transactionRef);
            return;
        }
        if (!"COMPLETED".equals(status) && !"FAILED".equals(status)) {
            throw new IllegalArgumentException("Unsupported payment status");
        }

        payment.setStatus(status);
        payment.setPaidAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);

        if ("COMPLETED".equals(status)) {
            publishCompletedEvent(saved);
            log.info("[Payment] Gateway IPN: Order {} paid via {} (TxnRef: {})", orderId, method, transactionRef);
        } else {
            publishFailedEvent(saved, "Gateway reported failure or user cancelled");
            log.warn("[Payment] Gateway IPN: Order {} FAILED via {} (TxnRef: {})", orderId, method, transactionRef);
        }
    }

    private void validateGatewayCallback(Payment payment, Long orderId, BigDecimal amount, String method) {
        boolean amountMatches = payment.getAmount() != null
                && amount != null
                && payment.getAmount().compareTo(amount) == 0;
        if (!payment.getOrderId().equals(orderId)
                || !amountMatches
                || !method.equals(payment.getPaymentMethod())) {
            throw new IllegalArgumentException("Gateway callback does not match payment intent");
        }
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
