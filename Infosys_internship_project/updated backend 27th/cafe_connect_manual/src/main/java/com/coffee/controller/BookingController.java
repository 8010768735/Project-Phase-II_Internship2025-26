package com.coffee.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.coffee.entity.Booking;
import com.coffee.service.BookingService;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // customer booking
    @PostMapping
    public Booking createBooking(@RequestBody Booking booking) {

        return bookingService.createBooking(booking);

    }

    // owner view bookings
    @GetMapping("/cafe/{cafeId}")
    public List<Booking> getCafeBookings(@PathVariable Long cafeId) {

        return bookingService.getCafeBookings(cafeId);

    }

    @GetMapping("/customer/{customerId}")
    public List<Booking> getCustomerBookings(@PathVariable Long customerId) {
        return bookingService.getCustomerBookings(customerId);
    }

    // confirm or cancel
    @PutMapping("/{id}")
    public Booking updateStatus(@PathVariable Long id, @RequestParam String status) {

        return bookingService.updateStatus(id, status);

    }

    @PutMapping("/{id}/cancel")
    public Booking cancelBooking(
            @PathVariable Long id,
            @RequestParam(required = false) String reason
    ) {
        return bookingService.cancelBooking(id, reason);
    }
}
