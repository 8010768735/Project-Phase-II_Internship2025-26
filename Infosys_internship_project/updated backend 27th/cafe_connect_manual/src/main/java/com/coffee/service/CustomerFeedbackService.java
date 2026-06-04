package com.coffee.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.coffee.entity.CustomerFeedback;
import com.coffee.repository.CustomerFeedbackRepository;

@Service
public class CustomerFeedbackService {

    private final CustomerFeedbackRepository customerFeedbackRepository;

    public CustomerFeedbackService(CustomerFeedbackRepository customerFeedbackRepository) {
        this.customerFeedbackRepository = customerFeedbackRepository;
    }

    public CustomerFeedback saveFeedback(CustomerFeedback feedback) {
        if (feedback.getRating() == null) {
            feedback.setRating(5);
        }
        return customerFeedbackRepository.save(feedback);
    }

    public List<CustomerFeedback> getCafeFeedback(Long cafeId) {
        return customerFeedbackRepository.findByCafeIdOrderByCreatedAtDesc(cafeId);
    }

    public List<CustomerFeedback> getCustomerFeedback(Long customerId) {
        return customerFeedbackRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }
}
