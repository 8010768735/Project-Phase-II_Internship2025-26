package com.coffee.service;

import org.springframework.stereotype.Service;

import com.coffee.entity.Payment;
import com.coffee.repository.PaymentRepository;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Payment savePayment(Payment payment) {
        if (payment.getPaymentMethod() == null || payment.getPaymentMethod().isBlank()) {
            payment.setPaymentMethod("Razorpay");
        }

        if (payment.getPaymentStatus() == null || payment.getPaymentStatus().isBlank()) {
            payment.setPaymentStatus("Paid");
        }

        return paymentRepository.save(payment);
    }
}
