package com.rainbowforest.recommendationservice.service;

import com.rainbowforest.recommendationservice.feignClient.ProductClient;
import com.rainbowforest.recommendationservice.feignClient.UserClient;
import com.rainbowforest.recommendationservice.model.Product;
import com.rainbowforest.recommendationservice.model.Recommendation;
import com.rainbowforest.recommendationservice.model.User;
import com.rainbowforest.recommendationservice.repository.ProductRepository;
import com.rainbowforest.recommendationservice.repository.RecommendationRepository;
import com.rainbowforest.recommendationservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class RecommendationServiceTests {

    private final Long RECOMMENDATION_ID = 1L;
    private final Integer RATING = 5;
    private final String PRODUCT_NAME = "testProduct";
    private final String USER_NAME = "testUser";
    private User user;
    private Product product;
    private Recommendation recommendation;
    private List<Recommendation> recommendations;

    @Mock
    private RecommendationRepository repository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductClient productClient;

    @Mock
    private UserClient userClient;

    @InjectMocks
    private RecommendationServiceImpl recommendationService;

    @BeforeEach
    public void setUp(){
        user = new User();
        user.setId(7L);
        user.setUserName(USER_NAME);
        product = new Product();
        product.setId(9L);
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
    public void get_all_recommendation_by_product_name_test(){
        //given
        when(repository.findAllRatingByProductName(anyString())).thenReturn(recommendations);

        //when
        List<Recommendation> foundRecommendations = recommendationService.getAllRecommendationByProductName(PRODUCT_NAME);

        //then
        assertEquals(RECOMMENDATION_ID, foundRecommendations.get(0).getId());
        assertEquals(PRODUCT_NAME, foundRecommendations.get(0).getProduct().getProductName());
        assertEquals(USER_NAME, foundRecommendations.get(0).getUser().getUserName());
        Mockito.verify(repository, Mockito.times(1)).findAllRatingByProductName(anyString());
        Mockito.verifyNoMoreInteractions(repository);
    }

    @Test
    public void create_review_should_upsert_snapshots_and_save_approved_review(){
        when(productClient.getProductById(9L)).thenReturn(product);
        when(userClient.getUserById(7L)).thenReturn(user);
        when(userRepository.findById(7L)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(productRepository.findById(9L)).thenReturn(Optional.empty());
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(repository.save(any(Recommendation.class))).thenAnswer(invocation -> {
            Recommendation saved = invocation.getArgument(0);
            saved.setId(RECOMMENDATION_ID);
            return saved;
        });

        Recommendation created = recommendationService.createReview(
                7L,
                9L,
                5,
                "Rất hài lòng",
                "Sản phẩm chắc chắn và đúng mô tả");

        assertEquals(RECOMMENDATION_ID, created.getId());
        assertEquals("APPROVED", created.getStatus());
        assertEquals("Rất hài lòng", created.getTitle());
        assertEquals("Sản phẩm chắc chắn và đúng mô tả", created.getComment());
        assertEquals(9L, created.getProduct().getId());
        assertEquals(7L, created.getUser().getId());
        Mockito.verify(repository, Mockito.times(1)).save(any(Recommendation.class));
    }

    @Test
    public void get_reviews_by_product_should_return_approved_reviews_by_default(){
        when(repository.findAllByProduct_IdAndStatusOrderByCreatedAtDesc(9L, "APPROVED"))
                .thenReturn(recommendations);

        List<Recommendation> found = recommendationService.getReviews(9L, null);

        assertEquals(1, found.size());
        assertEquals(RECOMMENDATION_ID, found.get(0).getId());
        Mockito.verify(repository, Mockito.times(1))
                .findAllByProduct_IdAndStatusOrderByCreatedAtDesc(9L, "APPROVED");
    }

    @Test
    public void create_recommendation_should_create_rating_with_snapshots(){
        when(productClient.getProductById(9L)).thenReturn(product);
        when(userClient.getUserById(7L)).thenReturn(user);
        when(userRepository.findById(7L)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(productRepository.findById(9L)).thenReturn(Optional.empty());
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(repository.save(any(Recommendation.class))).thenAnswer(invocation -> {
            Recommendation saved = invocation.getArgument(0);
            saved.setId(RECOMMENDATION_ID);
            return saved;
        });

        Recommendation created = recommendationService.createRecommendation(7L, 9L, 5);

        assertEquals(RECOMMENDATION_ID, created.getId());
        assertEquals(5, created.getRating());
        assertEquals(9L, created.getProduct().getId());
        assertEquals(7L, created.getUser().getId());
    }

    @Test
    public void delete_recommendation_should_return_true_when_existing(){
        when(repository.existsById(RECOMMENDATION_ID)).thenReturn(true);

        boolean deleted = recommendationService.deleteRecommendation(RECOMMENDATION_ID);

        assertTrue(deleted);
        Mockito.verify(repository, Mockito.times(1)).deleteById(RECOMMENDATION_ID);
    }
}
