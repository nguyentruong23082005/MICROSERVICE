package com.rainbowforest.productcatalogservice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "content_pages", uniqueConstraints = {
        @UniqueConstraint(name = "uk_content_page_slug", columnNames = "slug")
})
public class ContentPage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slug", nullable = false, length = 120)
    private String slug;

    @Column(name = "title", nullable = false, length = 180)
    private String title;

    @Column(name = "page_type", length = 40)
    private String pageType;

    @Column(name = "summary", length = 500)
    private String summary;

    @Column(name = "body", length = 5000)
    private String body;

    @Column(name = "published", nullable = false)
    private boolean published = true;

    @Column(name = "display_order")
    private int displayOrder;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPageType() { return pageType; }
    public void setPageType(String pageType) { this.pageType = pageType; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
}
