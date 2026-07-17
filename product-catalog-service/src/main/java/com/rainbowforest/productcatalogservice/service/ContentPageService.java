package com.rainbowforest.productcatalogservice.service;

import com.rainbowforest.productcatalogservice.entity.ContentPage;

import java.util.List;

public interface ContentPageService {
    List<ContentPage> getAllPages();
    List<ContentPage> getPublishedPages();
    ContentPage getPageById(Long id);
    ContentPage getPublishedPageBySlug(String slug);
    ContentPage savePage(ContentPage page);
    ContentPage updatePage(Long id, ContentPage page);
    boolean deletePage(Long id);
}
