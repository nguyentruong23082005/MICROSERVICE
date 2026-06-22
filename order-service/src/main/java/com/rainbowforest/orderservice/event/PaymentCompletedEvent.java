package com.rainbowforest.orderservice.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Event nhận từ payment-service khi thanh toán thành công */
public class PaymentCompletedEvent {
    private Long paymentId;
    private Long orderId;
    private Long userId;
    private BigDecimal amount;
    private String status;
    private LocalDateTime paidAt;

    public PaymentCompletedEvent() {}

    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
