package com.coffee.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.coffee.entity.Orders;
import com.coffee.service.OrdersService;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrdersController {

    private final OrdersService ordersService;

    public OrdersController(OrdersService ordersService) {
        this.ordersService = ordersService;
    }

    @PostMapping
    public Orders createOrder(@RequestBody Orders order) {
        return ordersService.createOrder(order);
    }

    @GetMapping("/customer/{customerId}")
    public List<Orders> getOrdersByCustomer(@PathVariable Long customerId) {
        return ordersService.getOrdersByCustomer(customerId);
    }

    // GET orders by cafe
    @GetMapping("/cafe/{cafeId}")
    public List<Orders> getOrdersByCafe(@PathVariable Long cafeId) {
        return ordersService.getOrdersByCafe(cafeId);
    }

    // UPDATE order status
    @PutMapping("/{id}/status")
    public Orders updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) Long assignedChefId,
            @RequestParam(required = false) String assignedChefName,
            @RequestParam(required = false) Long assignedWaiterId,
            @RequestParam(required = false) String assignedWaiterName
    ) {
        return ordersService.updateOrderStatus(id, status, assignedChefId, assignedChefName, assignedWaiterId, assignedWaiterName);
    }
}



//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.PathVariable;
//import org.springframework.web.bind.annotation.PutMapping;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//import com.coffee.entity.Orders;
//import com.coffee.service.OrdersService;
//
//@RestController
//@RequestMapping("/api")
//public class OrdersController {
// 
//	@Autowired
//	private OrdersService orderService;
//	
//	@GetMapping("/orders")
//	public List<Orders> getOrders(){
//		return orderService.getOrders();
//	}
//	
//	@PutMapping("/orders/{id}/{status}")
//	public Orders updateOrderStatus(@PathVariable Long id, @PathVariable String status) {
//		return orderService.updateOrderStatus(id,status);
//	}
//}
