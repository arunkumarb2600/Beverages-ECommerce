package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.OrderCreateRequest;
import com.beverages.ecommerce.dto.OrderDTO;
import java.util.List;

public interface OrderService {
    
    OrderDTO createOrder(OrderCreateRequest request, Long userId);
    
    OrderDTO getOrderById(Long id, Long userId, String userRole);
    
    List<OrderDTO> getUserOrders(Long userId);
    
    List<OrderDTO> getAllOrders();
    
    OrderDTO updateOrderStatus(Long id, String status);
    
    void deleteOrder(Long id, Long userId, String userRole);
}
