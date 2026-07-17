package com.rainbowforest.paymentservice.repository;

import com.rainbowforest.paymentservice.domain.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByOrderId(Long orderId);

    Optional<Payment> findFirstByOrderIdOrderByIdDesc(Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.transactionRef = :transactionRef")
    Optional<Payment> findByTransactionRef(String transactionRef);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED'")
    BigDecimal sumCompletedRevenue();

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'COMPLETED'")
    long countCompletedOrders();

    @Query("SELECT p FROM Payment p WHERE p.status = 'COMPLETED'")
    List<Payment> findAllCompleted();
}
