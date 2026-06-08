package com.rainbowforest.paymentservice.service;

import com.rainbowforest.paymentservice.domain.Payment;
import com.rainbowforest.paymentservice.event.OrderCreatedEvent;
import com.rainbowforest.paymentservice.event.PaymentCompletedEvent;
import com.rainbowforest.paymentservice.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, PaymentCompletedEvent> kafkaTemplate;
    private final String paymentCompletedTopic;

    public PaymentService(PaymentRepository paymentRepository,
                          KafkaTemplate<String, PaymentCompletedEvent> kafkaTemplate,
                          @Value("${app.kafka.topics.payment-completed:payment-completed}") String paymentCompletedTopic) {
        this.paymentRepository = paymentRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.paymentCompletedTopic = paymentCompletedTopic;
    }

    public Payment processPayment(OrderCreatedEvent event) {
        Payment payment = new Payment();
        payment.setOrderId(event.getOrderId());
        payment.setUserId(event.getUserId());
        payment.setAmount(event.getTotal());
        payment.setStatus("COMPLETED");
        payment.setPaidAt(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);
        publishCompletedEvent(savedPayment);
        return savedPayment;
    }

    public List<Payment> getPaymentsByOrderId(Long orderId) {
        return paymentRepository.findAllByOrderId(orderId);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    private void publishCompletedEvent(Payment payment) {
        PaymentCompletedEvent event = new PaymentCompletedEvent(
                payment.getId(), payment.getOrderId(), payment.getUserId(),
                payment.getAmount(), payment.getStatus(), payment.getPaidAt());
        kafkaTemplate.send(paymentCompletedTopic, String.valueOf(payment.getOrderId()), event);
    }
}
