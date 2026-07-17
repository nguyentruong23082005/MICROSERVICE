package com.rainbowforest.notificationservice.event;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Event nhận từ Kafka khi Order Service tạo đơn hàng mới.
 */
public class OrderCreatedEvent {

    private Long orderId;
    private Long userId;
    private BigDecimal total;
    private String status;
    private LocalDate orderedDate;
    private List<OrderItemEvent> items;
    private String customerEmail;
    private String customerName;

    public OrderCreatedEvent() {
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getOrderedDate() { return orderedDate; }
    public void setOrderedDate(LocalDate orderedDate) { this.orderedDate = orderedDate; }

    public List<OrderItemEvent> getItems() { return items; }
    public void setItems(List<OrderItemEvent> items) { this.items = items; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
}
