//package com.coffee.controller;
//
//import org.springframework.web.bind.annotation.*;
//import com.coffee.service.AdminService;
//import com.coffee.io.DashboardResponse;
//
//@RestController
//@RequestMapping("/api/admin")
//@CrossOrigin(origins = "http://localhost:3000")
//public class AdminController {
//
//    private final AdminService adminService;
//
//    public AdminController(AdminService adminService) {
//        this.adminService = adminService;
//    }
//
//    @GetMapping("/dashboard")
//    public DashboardResponse getDashboard() {
//        return adminService.getDashboardData();
//    }
//}


package com.coffee.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.coffee.io.AdminCafeResponse;
import com.coffee.io.AdminDashboardSummaryResponse;
import com.coffee.io.AdminUserResponse;
import com.coffee.service.AdminService;

@RestController
@RequestMapping({"/admin", "/api/admin"})
@CrossOrigin
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/pending-requests")
    public List<AdminUserResponse> getPendingRequests(){

        return adminService.getPendingRequests();
    }

    @GetMapping("/dashboard-summary")
    public AdminDashboardSummaryResponse getDashboardSummary() {
        return adminService.getDashboardSummary();
    }

    @GetMapping("/users")
    public List<AdminUserResponse> getAllUsers() {
        return adminService.getAllUsers();
    }

    @GetMapping("/cafes")
    public List<AdminCafeResponse> getAllCafes() {
        return adminService.getAllCafes();
    }

    @PostMapping("/approve/{id}")
    public String approve(@PathVariable Long id){

        return adminService.approveUser(id);
    }

    @PostMapping("/reject/{id}")
    public String reject(@PathVariable Long id){

        return adminService.rejectUser(id);
    }
}
