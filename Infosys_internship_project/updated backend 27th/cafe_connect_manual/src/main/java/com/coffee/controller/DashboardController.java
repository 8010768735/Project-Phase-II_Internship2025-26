package com.coffee.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.coffee.service.DashboardService;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/{cafeId}")
    public Map<String, Integer> getDashboardStats(@PathVariable Long cafeId) {
        return dashboardService.getDashboardStats(cafeId);
    }

}
