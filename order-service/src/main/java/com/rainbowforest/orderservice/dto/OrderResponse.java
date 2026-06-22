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
    private String phoneNumber;
    private UserInfo user;
    private List<ItemInfo> items;

    public static OrderResponse from(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setOrderedDate(order.getOrderedDate());
        response.setStatus(order.getStatus());
        response.setTotal(order.getTotal());
        response.setPhoneNumber(order.getPhoneNumber());

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

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public List<ItemInfo> getItems() { return items; }
    public void setItems(List<ItemInfo> items) { this.items = items; }

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

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
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
}
