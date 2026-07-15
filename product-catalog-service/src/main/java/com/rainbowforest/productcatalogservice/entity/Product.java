package com.rainbowforest.productcatalogservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_name")
    @NotNull
    private String productName;

    @Column(name = "price")
    @NotNull
    private BigDecimal price;

    /** Kept with original column name for backward compatibility; alias via getter/setter */
    @Column(name = "discription", length = 2000)
    private String discription;

    @Column(name = "category")
    @NotNull
    private String category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({"parent", "children", "hibernateLazyInitializer", "handler"})
    private Category categoryRef;

    @Column(name = "availability")
    @NotNull
    private int availability;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // ── Furniture domain fields ───────────────────────────────────────────────

    /** Phòng phù hợp: Living Room, Bedroom, Dining Room, Workspace */
    @Column(name = "room")
    private String room;

    /** Chất liệu: Oak, Walnut, Linen, Leather … */
    @Column(name = "material")
    private String material;

    /** Màu sắc: Natural, Sand, Charcoal … */
    @Column(name = "color")
    private String color;

    /** Kích thước dạng text, vd: "W120 x D60 x H75 cm" */
    @Column(name = "dimensions")
    private String dimensions;

    /** Bộ sưu tập / dòng sản phẩm */
    @Column(name = "collection")
    private String collection;

    /** Mã SKU nội bộ */
    @Column(name = "sku", unique = true)
    private String sku;

    /** URL-friendly slug cho SEO */
    @Column(name = "slug", unique = true)
    private String slug;

    /** Thời gian bảo hành, vd: "24 tháng" */
    @Column(name = "warranty")
    private String warranty;

    /** Cân nặng kg */
    @Column(name = "weight_kg")
    private Double weightKg;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC, id ASC")
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC, id ASC")
    private List<ProductSpecification> specifications = new ArrayList<>();

    public Product() {}

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getDiscription() { return discription; }
    public void setDiscription(String discription) { this.discription = discription; }

    /** Alias so frontend can also send "description" */
    public String getDescription() { return discription; }
    public void setDescription(String description) { this.discription = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Category getCategoryRef() { return categoryRef; }
    public void setCategoryRef(Category categoryRef) { this.categoryRef = categoryRef; }

    public int getAvailability() { return availability; }
    public void setAvailability(int availability) { this.availability = availability; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getDimensions() { return dimensions; }
    public void setDimensions(String dimensions) { this.dimensions = dimensions; }

    public String getCollection() { return collection; }
    public void setCollection(String collection) { this.collection = collection; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getWarranty() { return warranty; }
    public void setWarranty(String warranty) { this.warranty = warranty; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public List<ProductImage> getImages() { return images; }
    public void setImages(List<ProductImage> images) {
        this.images.clear();
        if (images != null) {
            images.forEach(this::addImage);
        }
    }

    public void addImage(ProductImage image) {
        if (image != null) {
            image.setProduct(this);
            this.images.add(image);
        }
    }

    public List<ProductSpecification> getSpecifications() { return specifications; }
    public void setSpecifications(List<ProductSpecification> specifications) {
        this.specifications.clear();
        if (specifications != null) {
            specifications.forEach(this::addSpecification);
        }
    }

    public void addSpecification(ProductSpecification specification) {
        if (specification != null) {
            specification.setProduct(this);
            this.specifications.add(specification);
        }
    }
}
