package com.coffee.service;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.coffee.entity.CafeDetails;
import com.coffee.repository.BookingRepo;
import com.coffee.repository.CafeDetailsRepo;
import com.coffee.repository.CafeTableRepository;
import com.coffee.repository.MenuItemRepo;
import com.coffee.repository.OrdersRepo;
import com.coffee.repository.StaffRepo;

@Service
public class DashboardService {

    private final CafeDetailsRepo cafeDetailsRepo;
    private final MenuItemRepo menuItemRepo;
    private final StaffRepo staffRepo;
    private final BookingRepo bookingRepo;
    private final OrdersRepo ordersRepo;
    private final CafeTableRepository cafeTableRepository;

    public DashboardService(
            CafeDetailsRepo cafeDetailsRepo,
            MenuItemRepo menuItemRepo,
            StaffRepo staffRepo,
            BookingRepo bookingRepo,
            OrdersRepo ordersRepo,
            CafeTableRepository cafeTableRepository
    ) {
        this.cafeDetailsRepo = cafeDetailsRepo;
        this.menuItemRepo = menuItemRepo;
        this.staffRepo = staffRepo;
        this.bookingRepo = bookingRepo;
        this.ordersRepo = ordersRepo;
        this.cafeTableRepository = cafeTableRepository;
    }

    public Map<String, Integer> getDashboardStats(Long cafeId) {
        CafeDetails cafe = cafeDetailsRepo.findById(cafeId)
                .orElseThrow(() -> new RuntimeException("Cafe not found"));

        Map<String, Integer> stats = new LinkedHashMap<>();
        stats.put("cafes", cafeDetailsRepo.findByOwnerId(cafe.getOwnerId()).size());
        stats.put("menu", menuItemRepo.findByCafeId(cafeId).size());
        stats.put("staff", staffRepo.findByCafeId(cafeId).size());
        stats.put("reservations", bookingRepo.findByCafeId(cafeId).size());
        stats.put("orders", ordersRepo.findByCafeId(cafeId).size());
        stats.put("tables", cafeTableRepository.findByCafeId(cafeId).size());
        return stats;
    }
}
