package com.rainbowforest.orderservice.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.rainbowforest.orderservice.dto.ShippingFeeRequest;
import com.rainbowforest.orderservice.dto.ShippingFeeResponse;
import com.rainbowforest.orderservice.dto.ShippingLocationResponse;
import com.rainbowforest.orderservice.service.GhnShippingService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class ShippingControllerTest {

    private MockMvc mockMvc;
    private GhnShippingService ghnShippingService;

    @BeforeEach
    void setUp() {
        ghnShippingService = mock(GhnShippingService.class);
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new ShippingController(ghnShippingService))
                .setValidator(validator)
                .build();
    }

    @Test
    void calculateFee_shouldReturnGhnFee() throws Exception {
        when(ghnShippingService.calculateFee(any(ShippingFeeRequest.class)))
                .thenReturn(new ShippingFeeResponse(new BigDecimal("32000"), null, "Kho trung tam", false));

        mockMvc.perform(post("/shipping/fee")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "toDistrictId": 1452,
                                  "toWardCode": "21012",
                                  "totalWeightGram": 15000,
                                  "lengthCm": 120,
                                  "widthCm": 80,
                                  "heightCm": 80
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fee").value(32000))
                .andExpect(jsonPath("$.nearestStoreName").value("Kho trung tam"))
                .andExpect(jsonPath("$.estimated").value(false));

        verify(ghnShippingService).calculateFee(any(ShippingFeeRequest.class));
    }

    @Test
    void calculateFee_shouldRejectInvalidDestination() throws Exception {
        mockMvc.perform(post("/shipping/fee")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "toDistrictId": 0,
                                  "toWardCode": ""
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getProvinces_shouldReturnLocationList() throws Exception {
        when(ghnShippingService.getProvinces())
                .thenReturn(List.of(new ShippingLocationResponse(201, null, "Hà Nội")));

        mockMvc.perform(get("/shipping/provinces"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(201))
                .andExpect(jsonPath("$[0].name").value("Hà Nội"));
    }

    @Test
    void getDistricts_shouldRejectInvalidProvince() throws Exception {
        mockMvc.perform(get("/shipping/districts?provinceId=0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getWards_shouldReturnWardCodes() throws Exception {
        when(ghnShippingService.getWards(1452))
                .thenReturn(List.of(new ShippingLocationResponse(null, "21012", "Phường 1")));

        mockMvc.perform(get("/shipping/wards?districtId=1452"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("21012"))
                .andExpect(jsonPath("$[0].name").value("Phường 1"));
    }
}