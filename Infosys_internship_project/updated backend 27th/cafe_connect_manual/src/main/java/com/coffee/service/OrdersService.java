package com.coffee.service;

import org.springframework.stereotype.Service;

import com.coffee.entity.Orders;
import com.coffee.repository.OrdersRepo;

import java.util.List;
import java.util.Optional;

@Service
public class OrdersService {

    private final OrdersRepo ordersRepo;

    public OrdersService(OrdersRepo ordersRepo) {
        this.ordersRepo = ordersRepo;
    }

    // Get orders by cafe
    public List<Orders> getOrdersByCafe(Long cafeId) {
        return ordersRepo.findByCafeId(cafeId);
    }

    public List<Orders> getOrdersByCustomer(Long customerId) {
        return ordersRepo.findByCustomerIdOrderByIdDesc(customerId);
    }

    public Orders createOrder(Orders order) {
        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("Pending");
        }
        order.setOrderStatus(order.getStatus());

        if (order.getItemCount() == null) {
            order.setItemCount(0);
        }
        order.setNoOfItems(order.getItemCount());

        if (order.getTotalAmount() == null) {
            order.setTotalAmount(0.0);
        }
        order.setPrice(order.getTotalAmount());

        if (order.getTableNumber() == null) {
            order.setTableNumber(0);
        }

        if ((order.getItems() == null || order.getItems().isBlank()) && order.getItemsSummary() != null) {
            order.setItems(order.getItemsSummary());
        }

        return ordersRepo.save(order);
    }

    // Update order status
    public Orders updateOrderStatus(Long id, String status) {
        return updateOrderStatus(id, status, null, null, null, null);
    }

    public Orders updateOrderStatus(Long id, String status, Long assignedChefId, String assignedChefName) {
        return updateOrderStatus(id, status, assignedChefId, assignedChefName, null, null);
    }

    public Orders updateOrderStatus(
            Long id,
            String status,
            Long assignedChefId,
            String assignedChefName,
            Long assignedWaiterId,
            String assignedWaiterName
    ) {

        Optional<Orders> optionalOrder = ordersRepo.findById(id);

        if (optionalOrder.isPresent()) {

            Orders order = optionalOrder.get();
            order.setStatus(status);
            order.setOrderStatus(status);

            if (assignedChefId != null) {
                order.setAssignedChefId(assignedChefId);
            }

            if (assignedChefName != null && !assignedChefName.isBlank()) {
                order.setAssignedChefName(assignedChefName);
            }

            if (assignedWaiterId != null) {
                order.setAssignedWaiterId(assignedWaiterId);
            }

            if (assignedWaiterName != null && !assignedWaiterName.isBlank()) {
                order.setAssignedWaiterName(assignedWaiterName);
            }

            return ordersRepo.save(order);
        }

        return null;
    }

}



//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import com.coffee.entity.Orders;
//import com.coffee.repository.OrdersRepo;
//
//@Service
//public class OrdersService {
//
//	@Autowired
//	private OrdersRepo ordersRepo;
//	
//	public List<Orders> getOrders(){
//		return ordersRepo.findAll();
//	}
//	
//	public Orders updateOrderStatus(Long id , String status) {
//		Orders orders=ordersRepo.findById(id).orElseThrow();
//		orders.setStatus(status);
//		return ordersRepo.save(orders);
//	} 
//}
