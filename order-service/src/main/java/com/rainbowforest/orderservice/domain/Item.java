package com.rainbowforest.orderservice.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long id;

    @Column(name = "quantity")
    @NotNull
    private int quantity;

    @Column(name = "subtotal")
    @NotNull
    private BigDecimal subTotal;

    // Lưu product_id vào cột riêng; thông tin đầy đủ của Product được nhúng
    // vào dưới dạng JSON thông qua @Transient khi serialize response
    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name", length = 200)
    private String productName;

    @Column(name = "product_price", precision = 19, scale = 2)
    private BigDecimal productPrice;

    @Column(name = "product_category", length = 100)
    private String productCategory;

    // Thông tin Product đầy đủ nhúng trong response (không lưu DB, không dùng cho equals)
    // Được tạo lại khi cần hiển thị dựa trên productId/productName/productPrice/productCategory
    @Transient
    @JsonIgnore
    private Product product;

    @ManyToMany(mappedBy = "items")
    @JsonIgnore
    private List<Order> orders;

    public Item() {
    }

    public Item(@NotNull int quantity, Product product, BigDecimal subTotal) {
        this.quantity = quantity;
        this.subTotal = subTotal;
        if (product != null) {
            this.product = product;
            this.productId = product.getId();
            this.productName = product.getProductName();
            this.productPrice = product.getPrice();
            this.productCategory = product.getCategory();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getSubTotal() {
        return subTotal;
    }

    public void setSubTotal(BigDecimal subTotal) {
        this.subTotal = subTotal;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public BigDecimal getProductPrice() {
        return productPrice;
    }

    public void setProductPrice(BigDecimal productPrice) {
        this.productPrice = productPrice;
    }

    public String getProductCategory() {
        return productCategory;
    }

    public void setProductCategory(String productCategory) {
        this.productCategory = productCategory;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
        if (product != null) {
            this.productId = product.getId();
            this.productName = product.getProductName();
            this.productPrice = product.getPrice();
            this.productCategory = product.getCategory();
        }
    }

    public List<Order> getOrders() {
        return orders;
    }

    public void setOrders(List<Order> orders) {
        this.orders = orders;
    }

    /**
     * Tạo Product DTO từ các fields đã denormalize — dùng để hiển thị trong response.
     * Không dùng @Transient product vì không được serialize vào Redis.
     */
    public Product toProductDto() {
        if (productId == null) return null;
        Product p = new Product();
        p.setId(productId);
        p.setProductName(productName);
        p.setPrice(productPrice);
        p.setCategory(productCategory);
        return p;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Item item = (Item) o;
        return Objects.equals(id, item.id)
                && Objects.equals(productId, item.productId)
                && Objects.equals(quantity, item.quantity);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, productId, quantity);
    }
}
