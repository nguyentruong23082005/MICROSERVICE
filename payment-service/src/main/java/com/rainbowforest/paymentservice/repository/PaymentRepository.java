package com.rainbowforest.paymentservice.repository;

import com.rainbowforest.paymentservice.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByOrderId(Long orderId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED'")
    BigDecimal sumCompletedRevenue();

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'COMPLETED'")
    long countCompletedOrders();

    @Query("SELECT p FROM Payment p WHERE p.status = 'COMPLETED'")
    List<Payment> findAllCompleted();
}
