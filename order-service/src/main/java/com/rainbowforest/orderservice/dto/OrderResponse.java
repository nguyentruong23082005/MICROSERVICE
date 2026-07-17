package com.rainbowforest.orderservice.dto;

import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.domain.Item;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO dùng để trả về response đặt hàng với đầy đủ thông tin:
 * - User info
 * - Danh sách Item (với Product đầy đủ từ denormalized fields)
 * - Tổng tiền
 * Tránh circular reference khi serialize.
 */
public class OrderResponse {

    private Long id;
    private LocalDate orderedDate;
    private String status;
    private BigDecimal total;
    private BigDecimal subtotal;
    private BigDecimal discountTotal;
    private BigDecimal shippingFee;
    private String couponCode;
    private String trackingNumber;
    private String phoneNumber;
    private String shippingName;
    private String shippingEmail;
    private String shippingPhone;
    private String shippingAddress;
    private String shippingCity;
    private UserInfo user;
    private List<ItemInfo> items;
    private List<TrackingStep> trackingSteps;

    public static OrderResponse from(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setOrderedDate(order.getOrderedDate());
        response.setStatus(order.getStatus());
        response.setTotal(order.getTotal());
        response.setSubtotal(order.getSubtotal());
        response.setDiscountTotal(order.getDiscountTotal());
        response.setShippingFee(order.getShippingFee());
        response.setCouponCode(order.getCouponCode());
        response.setTrackingNumber(order.getTrackingNumber());
        response.setPhoneNumber(order.getPhoneNumber());
        response.setTrackingSteps(buildTrackingSteps(order.getStatus()));
        response.setShippingName(order.getShippingName());
        response.setShippingEmail(order.getShippingEmail());
        response.setShippingPhone(order.getShippingPhone());
        response.setShippingAddress(order.getShippingAddress());
        response.setShippingCity(order.getShippingCity());

        if (order.getUser() != null) {
            UserInfo userInfo = new UserInfo();
            userInfo.setId(order.getUser().getId());
            userInfo.setUserName(order.getUser().getUserName());
            response.setUser(userInfo);
        }

        if (order.getItems() != null) {
            response.setItems(
                order.getItems().stream()
                    .map(ItemInfo::from)
                    .collect(Collectors.toList())
            );
        }
        return response;
    }

    // ── Getters / Setters ──────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getOrderedDate() { return orderedDate; }
    public void setOrderedDate(LocalDate orderedDate) { this.orderedDate = orderedDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDiscountTotal() { return discountTotal; }
    public void setDiscountTotal(BigDecimal discountTotal) { this.discountTotal = discountTotal; }

    public BigDecimal getShippingFee() { return shippingFee; }
    public void setShippingFee(BigDecimal shippingFee) { this.shippingFee = shippingFee; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getShippingName() { return shippingName; }
    public void setShippingName(String shippingName) { this.shippingName = shippingName; }

    public String getShippingEmail() { return shippingEmail; }
    public void setShippingEmail(String shippingEmail) { this.shippingEmail = shippingEmail; }

    public String getShippingPhone() { return shippingPhone; }
    public void setShippingPhone(String shippingPhone) { this.shippingPhone = shippingPhone; }

    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }

    public String getShippingCity() { return shippingCity; }
    public void setShippingCity(String shippingCity) { this.shippingCity = shippingCity; }

    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public List<ItemInfo> getItems() { return items; }
    public void setItems(List<ItemInfo> items) { this.items = items; }

    public List<TrackingStep> getTrackingSteps() { return trackingSteps; }
    public void setTrackingSteps(List<TrackingStep> trackingSteps) { this.trackingSteps = trackingSteps; }

    // ── Nested DTOs ────────────────────────────────────────────────────────

    public static class UserInfo {
        private Long id;
        private String userName;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
    }

    public static class ProductInfo {
        private Long id;
        private String productName;
        private BigDecimal price;
        private String category;
        private String imageUrl;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    }

    public static class ItemInfo {
        private int quantity;
        private BigDecimal subTotal;
        private ProductInfo product;

        public static ItemInfo from(Item item) {
            ItemInfo info = new ItemInfo();
            info.setQuantity(item.getQuantity());
            info.setSubTotal(item.getSubTotal());

            // Tái tạo ProductInfo từ các fields đã denormalize trong Item
            if (item.getProductId() != null) {
                ProductInfo pi = new ProductInfo();
                pi.setId(item.getProductId());
                pi.setProductName(item.getProductName());
                pi.setPrice(item.getProductPrice());
                pi.setCategory(item.getProductCategory());
                pi.setImageUrl(item.getProductImageUrl());
                info.setProduct(pi);
            }
            return info;
        }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
        public BigDecimal getSubTotal() { return subTotal; }
        public void setSubTotal(BigDecimal subTotal) { this.subTotal = subTotal; }
        public ProductInfo getProduct() { return product; }
        public void setProduct(ProductInfo product) { this.product = product; }
    }

    public static class TrackingStep {
        private String status;
        private String label;
        private boolean completed;
        private boolean current;

        public TrackingStep(String status, String label, boolean completed, boolean current) {
            this.status = status;
            this.label = label;
            this.completed = completed;
            this.current = current;
        }

        public String getStatus() { return status; }
        public String getLabel() { return label; }
        public boolean isCompleted() { return completed; }
        public boolean isCurrent() { return current; }
    }

    private static List<TrackingStep> buildTrackingSteps(String status) {
        String currentStatus = status == null ? "PAYMENT_EXPECTED" : status;
        if ("CANCELLED".equals(currentStatus) || "PAYMENT_FAILED".equals(currentStatus) || "FAILED".equals(currentStatus)) {
            return List.of(
                    new TrackingStep("PAYMENT_EXPECTED", "Tiếp nhận đơn", true, false),
                    new TrackingStep(currentStatus, "Đơn đã dừng xử lý", true, true)
            );
        }

        List<String> statuses = List.of("PAYMENT_EXPECTED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED");
        List<String> labels = List.of("Tiếp nhận đơn", "Đã thanh toán", "Đang chuẩn bị", "Đang giao hàng", "Đã giao");
        int currentIndex = statuses.indexOf(currentStatus);
        if (currentIndex < 0) {
            currentIndex = 0;
        }
        final int activeIndex = currentIndex;
        return java.util.stream.IntStream.range(0, statuses.size())
                .mapToObj(index -> new TrackingStep(
                        statuses.get(index),
                        labels.get(index),
                        index <= activeIndex,
                        index == activeIndex))
                .collect(Collectors.toList());
    }
}
