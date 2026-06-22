package com.rainbowforest.paymentservice.dto;

import java.math.BigDecimal;
import java.util.Map;

public class RevenueStatisticsResponse {

    private BigDecimal totalRevenue;
    private long totalOrders;
    private Map<String, BigDecimal> dailyRevenue;   // "2026-06-22" → amount
    private Map<String, BigDecimal> monthlyRevenue; // "2026-06"    → amount

    public RevenueStatisticsResponse() {}

    public RevenueStatisticsResponse(BigDecimal totalRevenue, long totalOrders,
                                     Map<String, BigDecimal> dailyRevenue,
                                     Map<String, BigDecimal> monthlyRevenue) {
        this.totalRevenue = totalRevenue;
        this.totalOrders = totalOrders;
        this.dailyRevenue = dailyRevenue;
        this.monthlyRevenue = monthlyRevenue;
    }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }
    public Map<String, BigDecimal> getDailyRevenue() { return dailyRevenue; }
    public void setDailyRevenue(Map<String, BigDecimal> dailyRevenue) { this.dailyRevenue = dailyRevenue; }
    public Map<String, BigDecimal> getMonthlyRevenue() { return monthlyRevenue; }
    public void setMonthlyRevenue(Map<String, BigDecimal> monthlyRevenue) { this.monthlyRevenue = monthlyRevenue; }
}
