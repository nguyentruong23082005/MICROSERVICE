package com.rainbowforest.recommendationservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.rainbowforest.recommendationservice.model.Product;
import com.rainbowforest.recommendationservice.model.Recommendation;
import com.rainbowforest.recommendationservice.model.User;
import com.rainbowforest.recommendationservice.service.RecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.ArrayList;
import java.util.List;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@SpringBootTest
public class RecommendationControllerTests {

    private final Long PRODUCT_ID = 1L;
    private final Long USER_ID = 1L;
    private final Long RECOMMENDATION_ID = 1L;
    private final Integer RATING = 5;
    private final String PRODUCT_NAME = "testProduct";
    private final String USER_NAME = "testUser";
    private User user;
    private Product product;
    private Recommendation recommendation;
    private List<Recommendation> recommendations;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RecommendationService recommendationService;

    @BeforeEach
    public void setUp(){
        user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);
        product = new Product();
        product.setId(PRODUCT_ID);
        product.setProductName(PRODUCT_NAME);
        recommendation = new Recommendation();
        recommendation.setId(RECOMMENDATION_ID);
        recommendation.setUser(user);
        recommendation.setProduct(product);
        recommendation.setRating(RATING);
        recommendations = new ArrayList<>();
        recommendations.add(recommendation);
    }

    @Test
    public void get_all_rating_controller_should_return200_when_validRequest() throws Exception {
    	//when
        when(recommendationService.getAllRecommendationByProductName(anyString())).thenReturn(recommendations);

        //then
        mockMvc.perform(get("/recommendations").param("name", PRODUCT_NAME))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(RECOMMENDATION_ID))
                .andExpect(jsonPath("$[0].rating").value(RATING))
                .andExpect(jsonPath("$[0].product.productName").value(PRODUCT_NAME))
                .andExpect(jsonPath("$[0].user.userName").value(USER_NAME));
              
        verify(recommendationService, times(1)).getAllRecommendationByProductName(anyString());
        verifyNoMoreInteractions(recommendationService);
    }
    
    @Test
    public void get_all_rating_controller_should_return200_when_recommendationList_isEmpty() throws Exception {
    	//given
    	List<Recommendation> recommendations = new ArrayList<Recommendation>();
    	
    	//when
    	when(recommendationService.getAllRecommendationByProductName(anyString())).thenReturn(recommendations);

        //then
        mockMvc.perform(get("/recommendations").param("name", PRODUCT_NAME))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
                          
        verify(recommendationService, times(1)).getAllRecommendationByProductName(anyString());
        verifyNoMoreInteractions(recommendationService);
    }

    @Test
    public void save_recommendations_controller_should_return201_when_user_is_saved() throws Exception {
    	//given
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(SerializationFeature.WRAP_ROOT_VALUE, false);
        ObjectWriter objectWriter = mapper.writer().withDefaultPrettyPrinter();
        String requestJson = objectWriter.writeValueAsString(recommendation);
        
        //when
        when(recommendationService.createRecommendation(USER_ID, PRODUCT_ID, RATING)).thenReturn(recommendation);
        
        //then
        mockMvc.perform(post("/{userId}/recommendations/{productId}",USER_ID, PRODUCT_ID)
                .param("rating", RATING.toString())
                .content(requestJson)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.rating").value(RATING));

        verify(recommendationService, times(1)).createRecommendation(USER_ID, PRODUCT_ID, RATING);
        verifyNoMoreInteractions(recommendationService);
    }

    @Test
    public void get_reviews_controller_should_return200_for_product_reviews() throws Exception {
        recommendation.setTitle("Rất hài lòng");
        recommendation.setComment("Sản phẩm chắc chắn");
        recommendation.setStatus("APPROVED");
        when(recommendationService.getReviews(PRODUCT_ID, null)).thenReturn(recommendations);

        mockMvc.perform(get("/reviews").param("productId", PRODUCT_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(RECOMMENDATION_ID))
                .andExpect(jsonPath("$[0].rating").value(RATING))
                .andExpect(jsonPath("$[0].title").value("Rất hài lòng"))
                .andExpect(jsonPath("$[0].comment").value("Sản phẩm chắc chắn"))
                .andExpect(jsonPath("$[0].status").value("APPROVED"));

        verify(recommendationService, times(1)).getReviews(PRODUCT_ID, null);
    }

    @Test
    public void create_review_controller_should_return201_when_valid_request() throws Exception {
        String requestJson = """
                {
                  "rating": 5,
                  "title": "Rất hài lòng",
                  "comment": "Sản phẩm chắc chắn"
                }
                """;
        recommendation.setTitle("Rất hài lòng");
        recommendation.setComment("Sản phẩm chắc chắn");
        recommendation.setStatus("APPROVED");

        when(recommendationService.createReview(eq(USER_ID), eq(PRODUCT_ID), eq(5), eq("Rất hài lòng"), eq("Sản phẩm chắc chắn")))
                .thenReturn(recommendation);

        mockMvc.perform(post("/{userId}/reviews/{productId}", USER_ID, PRODUCT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.rating").value(RATING))
                .andExpect(jsonPath("$.title").value("Rất hài lòng"))
                .andExpect(jsonPath("$.comment").value("Sản phẩm chắc chắn"));

        verify(recommendationService, times(1))
                .createReview(eq(USER_ID), eq(PRODUCT_ID), eq(5), eq("Rất hài lòng"), eq("Sản phẩm chắc chắn"));
    }

    @Test
    public void update_review_status_controller_should_return200_when_review_exists() throws Exception {
        recommendation.setStatus("HIDDEN");
        when(recommendationService.updateReviewStatus(RECOMMENDATION_ID, "HIDDEN"))
                .thenReturn(recommendation);

        mockMvc.perform(put("/reviews/{id}/status", RECOMMENDATION_ID).param("status", "HIDDEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HIDDEN"));

        verify(recommendationService, times(1)).updateReviewStatus(RECOMMENDATION_ID, "HIDDEN");
    }

    @Test
    public void delete_review_controller_should_return204_when_review_exists() throws Exception {
        when(recommendationService.deleteRecommendation(RECOMMENDATION_ID)).thenReturn(true);

        mockMvc.perform(delete("/reviews/{id}", RECOMMENDATION_ID))
                .andExpect(status().isNoContent());

        verify(recommendationService, times(1)).deleteRecommendation(RECOMMENDATION_ID);
        verifyNoMoreInteractions(recommendationService);
    }
}
