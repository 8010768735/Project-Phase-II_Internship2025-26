package com.coffee.service;

import java.time.LocalDate;
import java.time.LocalTime;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import com.coffee.entity.Booking;
import com.coffee.repository.BookingRepo;

@Service
public class BookingService {
    private static final long FULL_REFUND_MINUTES = 5;
    private static final Set<String> NON_BLOCKING_STATUSES = Set.of(
            "DECLINED",
            "CANCELLED",
            "COMPLETED",
            "EXPIRED",
            "NO_SHOW"
    );
    private final BookingRepo bookingRepo;

    public BookingService(BookingRepo bookingRepo) {
        this.bookingRepo = bookingRepo;
    }

    public Booking createBooking(Booking booking) {
        validateTableAvailability(booking);
        normalizeCelebrationDetails(booking);

        booking.setStatus("PENDING");
        if (booking.getCreatedAt() == null || booking.getCreatedAt().isBlank()) {
            booking.setCreatedAt(LocalDateTime.now().toString());
        }
        if (booking.getAdvancePaymentStatus() == null || booking.getAdvancePaymentStatus().isBlank()) {
            booking.setAdvancePaymentStatus("PAID");
        }
        booking.setRefundAmount(0.0);
        booking.setRefundStatus("NOT_REQUESTED");

        return bookingRepo.save(booking);
    }

    public List<Booking> getCafeBookings(Long cafeId) {
        return bookingRepo.findByCafeId(cafeId);

    }

    public List<Booking> getCustomerBookings(Long customerId) {
        return bookingRepo.findByCustomerIdOrderByIdDesc(customerId);
    }

    public Booking updateStatus(Long id, String status) {

        Booking booking = bookingRepo.findById(id)
                .orElseThrow();

        booking.setStatus(status == null ? "PENDING" : status.trim().toUpperCase());

        return bookingRepo.save(booking);

    }

    public Booking cancelBooking(Long id, String cancellationReason) {
        Booking booking = bookingRepo.findById(id)
                .orElseThrow();

        String currentStatus = String.valueOf(booking.getStatus() == null ? "PENDING" : booking.getStatus()).trim().toUpperCase();
        if (isEventBooking(booking)
                && !"PENDING".equals(currentStatus)
                && !"APPROVED".equals(currentStatus)) {
            return booking;
        }

        if (!"PENDING".equals(currentStatus) && !"APPROVED".equals(currentStatus)) {
            return booking;
        }

        double paidAmount = Number.class.isInstance(booking.getAdvancePaymentAmount())
                ? booking.getAdvancePaymentAmount()
                : 0.0;
        double refundAmount = calculateRefundAmount(booking, paidAmount);

        booking.setStatus("CANCELLED");
        booking.setRefundAmount(refundAmount);
        booking.setRefundStatus(refundAmount > 0 ? "PROCESSED" : "NOT_APPLICABLE");
        booking.setCancellationReason(
                cancellationReason == null || cancellationReason.isBlank()
                        ? "Cancelled by customer"
                        : cancellationReason.trim()
        );
        booking.setCancelledAt(LocalDateTime.now().toString());

        return bookingRepo.save(booking);
    }

    private double calculateRefundAmount(Booking booking, double paidAmount) {
        if (paidAmount <= 0) {
            return 0.0;
        }

        if (isEventBooking(booking)) {
            String currentStatus = String.valueOf(booking.getStatus() == null ? "PENDING" : booking.getStatus()).trim().toUpperCase();
            if ("PENDING".equals(currentStatus)) {
                return Math.round((paidAmount * 0.8) * 100.0) / 100.0;
            }
            if ("APPROVED".equals(currentStatus)) {
                return Math.round((paidAmount * 0.5) * 100.0) / 100.0;
            }
            return 0.0;
        }

        LocalDateTime bookingDateTime = getBookingDateTime(booking);
        if (bookingDateTime == null) {
            return 0.0;
        }

        LocalDateTime createdAt = getCreatedAt(booking);
        if (createdAt != null) {
            long minutesSinceCreated = java.time.Duration.between(createdAt, LocalDateTime.now()).toMinutes();
            if (minutesSinceCreated >= 0 && minutesSinceCreated <= FULL_REFUND_MINUTES) {
                return Math.round(paidAmount * 100.0) / 100.0;
            }
        }

        long minutesUntilBooking = java.time.Duration.between(LocalDateTime.now(), bookingDateTime).toMinutes();

        if (minutesUntilBooking >= 24 * 60) {
            return Math.round((paidAmount * 0.8) * 100.0) / 100.0;
        }

        if (minutesUntilBooking >= 6 * 60) {
            return Math.round((paidAmount * 0.5) * 100.0) / 100.0;
        }

        if (minutesUntilBooking > 0) {
            return Math.round((paidAmount * 0.2) * 100.0) / 100.0;
        }

        return 0.0;
    }

    private boolean isEventBooking(Booking booking) {
        if (booking == null) {
            return false;
        }

        String occasion = booking.getOccasion() == null ? "" : booking.getOccasion().trim().toLowerCase();
        String seatingPreference = booking.getSeatingPreference() == null ? "" : booking.getSeatingPreference().trim().toLowerCase();
        String notes = booking.getNotes() == null ? "" : booking.getNotes().trim().toLowerCase();

        return "event_booking".equals(occasion)
                || "event booking".equals(seatingPreference)
                || notes.contains("event booking request");
    }

    private LocalDateTime getCreatedAt(Booking booking) {
        try {
            if (booking.getCreatedAt() == null || booking.getCreatedAt().isBlank()) {
                return null;
            }

            return LocalDateTime.parse(booking.getCreatedAt().trim());
        } catch (Exception ignored) {
            return null;
        }
    }

    private LocalDateTime getBookingDateTime(Booking booking) {
        try {
            if (booking.getBookingDate() == null || booking.getBookingTime() == null) {
                return null;
            }

            LocalDate bookingDate = LocalDate.parse(booking.getBookingDate().trim());
            LocalTime bookingTime = LocalTime.parse(booking.getBookingTime().trim());
            return LocalDateTime.of(bookingDate, bookingTime);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void validateTableAvailability(Booking booking) {
        if (booking == null || booking.getCafeId() == null || booking.getTableId() == null) {
            return;
        }

        String bookingDate = booking.getBookingDate() == null ? "" : booking.getBookingDate().trim();
        String bookingTime = booking.getBookingTime() == null ? "" : booking.getBookingTime().trim();
        if (bookingDate.isEmpty() || bookingTime.isEmpty()) {
            return;
        }

        boolean hasActiveConflict = bookingRepo
                .findByCafeIdAndTableIdAndBookingDateAndBookingTime(
                        booking.getCafeId(),
                        booking.getTableId(),
                        bookingDate,
                        bookingTime
                )
                .stream()
                .map(existingBooking -> String.valueOf(existingBooking.getStatus() == null ? "PENDING" : existingBooking.getStatus()).trim().toUpperCase())
                .anyMatch(status -> !NON_BLOCKING_STATUSES.contains(status));

        if (hasActiveConflict) {
            throw new IllegalStateException("This table is no longer available for the selected time.");
        }
    }

    private void normalizeCelebrationDetails(Booking booking) {
        if (booking == null) {
            return;
        }

        boolean celebrationEvent = Boolean.TRUE.equals(booking.getCelebrationEvent());
        booking.setCelebrationEvent(celebrationEvent);
        booking.setOccasion(trimToNull(booking.getOccasion()));
        booking.setNotes(trimToNull(booking.getNotes()));
        booking.setSeatingPreference(trimToNull(booking.getSeatingPreference()));

        if (!celebrationEvent) {
            booking.setCelebrationType(null);
            booking.setCustomCelebrationType(null);
            booking.setDecorationTheme(null);
            booking.setCakeMessage(null);
            booking.setSurpriseSetup(false);
            return;
        }

        booking.setCelebrationType(trimToNull(booking.getCelebrationType()));
        booking.setCustomCelebrationType(trimToNull(booking.getCustomCelebrationType()));
        booking.setDecorationTheme(trimToNull(booking.getDecorationTheme()));
        booking.setCakeMessage(trimToNull(booking.getCakeMessage()));
        booking.setSurpriseSetup(Boolean.TRUE.equals(booking.getSurpriseSetup()));
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
