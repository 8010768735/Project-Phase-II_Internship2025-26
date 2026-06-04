package com.coffee.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coffee.entity.CustomerFeedback;
import com.coffee.service.CustomerFeedbackService;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin
public class CustomerFeedbackController {

    private final CustomerFeedbackService customerFeedbackService;

    public CustomerFeedbackController(CustomerFeedbackService customerFeedbackService) {
        this.customerFeedbackService = customerFeedbackService;
    }

    @PostMapping
    public CustomerFeedback saveFeedback(@RequestBody CustomerFeedback feedback) {
        return customerFeedbackService.saveFeedback(feedback);
    }

    @GetMapping("/cafe/{cafeId}")
    public List<CustomerFeedback> getCafeFeedback(@PathVariable Long cafeId) {
        return customerFeedbackService.getCafeFeedback(cafeId);
    }

    @GetMapping("/customer/{customerId}")
    public List<CustomerFeedback> getCustomerFeedback(@PathVariable Long customerId) {
        return customerFeedbackService.getCustomerFeedback(customerId);
    }
}
