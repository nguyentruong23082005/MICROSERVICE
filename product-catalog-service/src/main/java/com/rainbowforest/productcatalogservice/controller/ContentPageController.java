package com.rainbowforest.productcatalogservice.controller;

import com.rainbowforest.productcatalogservice.entity.ContentPage;
import com.rainbowforest.productcatalogservice.http.header.HeaderGenerator;
import com.rainbowforest.productcatalogservice.service.ContentPageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ContentPageController {

    private final ContentPageService contentPageService;
    private final HeaderGenerator headerGenerator;

    public ContentPageController(ContentPageService contentPageService, HeaderGenerator headerGenerator) {
        this.contentPageService = contentPageService;
        this.headerGenerator = headerGenerator;
    }

    @GetMapping("/content-pages")
    public ResponseEntity<List<ContentPage>> getContentPages() {
        return ResponseEntity.ok(contentPageService.getPublishedPages());
    }

    @GetMapping("/content-pages/{slug}")
    public ResponseEntity<ContentPage> getContentPage(@PathVariable("slug") String slug) {
        ContentPage page = contentPageService.getPublishedPageBySlug(slug);
        if (page == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.ok(page);
    }

    @GetMapping("/admin/content-pages")
    public ResponseEntity<List<ContentPage>> getAllContentPages() {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(contentPageService.getAllPages());
    }

    @PostMapping("/admin/content-pages")
    public ResponseEntity<ContentPage> createContentPage(
            @RequestBody ContentPage page,
            HttpServletRequest request) {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            ContentPage saved = contentPageService.savePage(page);
            return new ResponseEntity<>(
                    saved,
                    headerGenerator.getHeadersForSuccessPostMethod(request, saved.getId()),
                    HttpStatus.CREATED);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/admin/content-pages/{id}")
    public ResponseEntity<ContentPage> updateContentPage(
            @PathVariable("id") Long id,
            @RequestBody ContentPage page) {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        try {
            ContentPage saved = contentPageService.updatePage(id, page);
            if (saved == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/admin/content-pages/{id}")
    public ResponseEntity<Void> deleteContentPage(@PathVariable("id") Long id) {
        if (!isAdmin()) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        if (!contentPageService.deletePage(id)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.ok().build();
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
