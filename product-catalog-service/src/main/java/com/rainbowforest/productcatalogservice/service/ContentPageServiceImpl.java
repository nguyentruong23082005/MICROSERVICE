package com.rainbowforest.productcatalogservice.service;

import com.rainbowforest.productcatalogservice.entity.ContentPage;
import com.rainbowforest.productcatalogservice.repository.ContentPageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ContentPageServiceImpl implements ContentPageService {

    private final ContentPageRepository contentPageRepository;

    public ContentPageServiceImpl(ContentPageRepository contentPageRepository) {
        this.contentPageRepository = contentPageRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContentPage> getAllPages() {
        return contentPageRepository.findAllByOrderByDisplayOrderAscTitleAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContentPage> getPublishedPages() {
        return contentPageRepository.findAllByPublishedTrueOrderByDisplayOrderAscTitleAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public ContentPage getPageById(Long id) {
        if (id == null) {
            return null;
        }
        return contentPageRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public ContentPage getPublishedPageBySlug(String slug) {
        return contentPageRepository.findBySlugAndPublishedTrue(slug).orElse(null);
    }

    @Override
    @Transactional
    public ContentPage savePage(ContentPage page) {
        if (page == null || normalize(page.getSlug()) == null || normalize(page.getTitle()) == null) {
            throw new IllegalArgumentException("Content page slug and title are required");
        }
        page.setSlug(normalizeSlug(page.getSlug()));
        page.setTitle(normalize(page.getTitle()));
        page.setPageType(normalize(page.getPageType()));
        page.setSummary(normalize(page.getSummary()));
        page.setBody(normalize(page.getBody()));
        return contentPageRepository.save(page);
    }

    @Override
    @Transactional
    public ContentPage updatePage(Long id, ContentPage page) {
        if (id == null || page == null) {
            throw new IllegalArgumentException("Content page id and payload are required");
        }
        if (!contentPageRepository.existsById(id)) {
            return null;
        }
        page.setId(id);
        return savePage(page);
    }

    @Override
    @Transactional
    public boolean deletePage(Long id) {
        if (id == null || !contentPageRepository.existsById(id)) {
            return false;
        }
        contentPageRepository.deleteById(id);
        return true;
    }

    private String normalizeSlug(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }
        return normalized.toLowerCase().replace(' ', '-');
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
