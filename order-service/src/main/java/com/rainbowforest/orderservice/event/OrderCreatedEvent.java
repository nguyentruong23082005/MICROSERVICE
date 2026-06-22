package com.rainbowforest.orderservice.event;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class OrderCreatedEvent {

    private Long orderId;
    private Long userId;
    private BigDecimal total;
    private String status;
    private LocalDate orderedDate;
    private List<OrderItemEvent> items;
    private Boolean forceFailure = false;

    public OrderCreatedEvent() {
    }

    public OrderCreatedEvent(Long orderId, Long userId, BigDecimal total, String status, LocalDate orderedDate, List<OrderItemEvent> items) {
        this.orderId = orderId;
        this.userId = userId;
        this.total = total;
        this.status = status;
        this.orderedDate = orderedDate;
        this.items = items;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getOrderedDate() {
        return orderedDate;
    }

    public void setOrderedDate(LocalDate orderedDate) {
        this.orderedDate = orderedDate;
    }

    public List<OrderItemEvent> getItems() {
        return items;
    }

    public void setItems(List<OrderItemEvent> items) {
        this.items = items;
    }

    public Boolean getForceFailure() {
        return forceFailure;
    }

    public void setForceFailure(Boolean forceFailure) {
        this.forceFailure = forceFailure;
    }
}
