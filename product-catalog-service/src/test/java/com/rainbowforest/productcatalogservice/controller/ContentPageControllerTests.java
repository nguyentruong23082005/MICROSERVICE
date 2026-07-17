package com.rainbowforest.productcatalogservice.controller;

import com.rainbowforest.productcatalogservice.entity.ContentPage;
import com.rainbowforest.productcatalogservice.service.ContentPageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ContentPageControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ContentPageService contentPageService;

    @Test
    void get_content_page_should_return_published_page() throws Exception {
        ContentPage page = new ContentPage();
        page.setId(1L);
        page.setSlug("showroom");
        page.setTitle("Showroom");
        page.setPublished(true);

        when(contentPageService.getPublishedPageBySlug("showroom")).thenReturn(page);

        mockMvc.perform(get("/content-pages/{slug}", "showroom"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.slug").value("showroom"))
                .andExpect(jsonPath("$.title").value("Showroom"));
    }

    @Test
    void get_content_pages_should_return_list() throws Exception {
        ContentPage page = new ContentPage();
        page.setSlug("gioi-thieu");
        page.setTitle("Giới thiệu");
        page.setPublished(true);

        when(contentPageService.getPublishedPages()).thenReturn(List.of(page));

        mockMvc.perform(get("/content-pages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("gioi-thieu"));
    }

    @Test
    void admin_should_list_all_content_pages() throws Exception {
        ContentPage page = new ContentPage();
        page.setId(2L);
        page.setSlug("draft-page");
        page.setTitle("Draft page");
        page.setPublished(false);

        when(contentPageService.getAllPages()).thenReturn(List.of(page));

        mockMvc.perform(get("/admin/content-pages")
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("draft-page"))
                .andExpect(jsonPath("$[0].published").value(false));
    }

    @Test
    void non_admin_should_not_create_content_page() throws Exception {
        mockMvc.perform(post("/admin/content-pages")
                        .header("X-User-Id", "2")
                        .header("X-User-Roles", "ROLE_USER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_should_create_content_page() throws Exception {
        ContentPage saved = new ContentPage();
        saved.setId(3L);
        saved.setSlug("bao-hanh");
        saved.setTitle("Bao hanh");
        saved.setPublished(true);

        when(contentPageService.savePage(any(ContentPage.class))).thenReturn(saved);

        mockMvc.perform(post("/admin/content-pages")
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "slug": "bao-hanh",
                                  "title": "Bao hanh",
                                  "pageType": "POLICY",
                                  "published": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.slug").value("bao-hanh"));
    }

    @Test
    void admin_should_update_content_page() throws Exception {
        ContentPage saved = new ContentPage();
        saved.setId(3L);
        saved.setSlug("bao-hanh");
        saved.setTitle("Bao hanh moi");
        saved.setPublished(true);

        when(contentPageService.updatePage(eq(3L), any(ContentPage.class))).thenReturn(saved);

        mockMvc.perform(put("/admin/content-pages/{id}", 3L)
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "slug": "bao-hanh",
                                  "title": "Bao hanh moi",
                                  "pageType": "POLICY",
                                  "published": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Bao hanh moi"));
    }

    @Test
    void admin_should_delete_content_page() throws Exception {
        when(contentPageService.deletePage(3L)).thenReturn(true);

        mockMvc.perform(delete("/admin/content-pages/{id}", 3L)
                        .header("X-User-Id", "1")
                        .header("X-User-Roles", "ROLE_ADMIN"))
                .andExpect(status().isOk());

        verify(contentPageService).deletePage(3L);
    }
}
