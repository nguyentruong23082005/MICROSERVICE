package com.rainbowforest.orderservice.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Event nhận từ payment-service khi thanh toán thất bại */
public class PaymentFailedEvent {
    private Long paymentId;
    private Long orderId;
    private Long userId;
    private BigDecimal amount;
    private String reason;
    private LocalDateTime failedAt;

    public PaymentFailedEvent() {}

    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getFailedAt() { return failedAt; }
    public void setFailedAt(LocalDateTime failedAt) { this.failedAt = failedAt; }
}
