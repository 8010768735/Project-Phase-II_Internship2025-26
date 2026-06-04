package com.coffee.controller;

import com.coffee.entity.Orders;
import com.coffee.entity.Reservation;
import com.coffee.entity.Staff;
import com.coffee.service.CafeTableService;
import com.coffee.service.OrdersService;
import com.coffee.service.ReservationService;
import com.coffee.service.StaffService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/waiter")
@CrossOrigin(origins = "*")
public class WaiterController {

    private final OrdersService ordersService;
    private final CafeTableService cafeTableService;
    private final ReservationService reservationService;
    private final StaffService staffService;

    public WaiterController(
            OrdersService ordersService,
            CafeTableService cafeTableService,
            ReservationService reservationService,
            StaffService staffService
    ) {
        this.ordersService = ordersService;
        this.cafeTableService = cafeTableService;
        this.reservationService = reservationService;
        this.staffService = staffService;
    }

    @GetMapping("/summary/{cafeId}")
    public Map<String, Long> getWaiterSummary(@PathVariable Long cafeId) {
        List<Orders> orders = ordersService.getOrdersByCafe(cafeId);
        List<Reservation> reservations = reservationService.getReservationsByCafe(cafeId);
        List<Staff> staffMembers = staffService.getStaffByCafe(cafeId);

        long activeOrders = orders.stream()
                .map(order -> normalize(order.getOrderStatus() != null ? order.getOrderStatus() : order.getStatus()))
                .filter(status -> status.equals("pending") || status.equals("preparing") || status.equals("ready"))
                .count();

        long readyOrders = orders.stream()
                .map(order -> normalize(order.getOrderStatus() != null ? order.getOrderStatus() : order.getStatus()))
                .filter(status -> status.equals("ready") || status.equals("completed") || status.equals("prepared"))
                .count();

        long servedOrders = orders.stream()
                .map(order -> normalize(order.getOrderStatus() != null ? order.getOrderStatus() : order.getStatus()))
                .filter(status -> status.equals("served"))
                .count();

        long pendingReservations = reservations.stream()
                .map(reservation -> normalize(reservation.getStatus()))
                .filter(status -> status.isBlank() || status.equals("pending") || status.equals("reserved"))
                .count();

        long totalWaiters = staffMembers.stream()
                .map(staff -> normalize(staff.getRole()))
                .filter(role -> role.equals("waiter"))
                .count();

        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("totalOrders", (long) orders.size());
        summary.put("activeOrders", activeOrders);
        summary.put("readyOrders", readyOrders);
        summary.put("servedOrders", servedOrders);
        summary.put("totalTables", (long) cafeTableService.getTablesByCafe(cafeId).size());
        summary.put("totalReservations", (long) reservations.size());
        summary.put("pendingReservations", pendingReservations);
        summary.put("totalWaiters", totalWaiters);
        return summary;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
