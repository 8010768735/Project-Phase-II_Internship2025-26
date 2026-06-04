package com.coffee.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.coffee.entity.Staff;
import com.coffee.service.StaffService;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "*")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    // GET staff by cafe
    @GetMapping("/cafe/{cafeId}")
    public List<Staff> getStaffByCafe(@PathVariable Long cafeId) {
        return staffService.getStaffByCafe(cafeId);
    }

    // ADD staff
    @PostMapping("/cafe/{cafeId}")
    public Staff addStaff(@PathVariable Long cafeId, @RequestBody Staff staff) {
        return staffService.addStaff(cafeId, staff);
    }

    // UPDATE staff
    @PutMapping("/{id}")
    public Staff updateStaff(@PathVariable Long id, @RequestBody Staff staff) {
        return staffService.updateStaff(id, staff);
    }

    // DELETE staff
    @DeleteMapping("/{id}")
    public void deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
    }

}




