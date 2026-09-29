package com.karimmarket.services;

import com.karimmarket.models.Order;
import com.karimmarket.repositories.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.TimeZone;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Fuseau de reference utilise pour decouper les journees de commande.
     * Sans cela, une commande passee en fin de journee peut atterrir le lendemain
     * dans le Dashboard / le rapport PDF.
     */
    @Value("${app.timezone:Africa/Casablanca}")
    private String timezone;

    private ZoneId zone() {
        try {
            return ZoneId.of(timezone);
        } catch (RuntimeException e) {
            return ZoneId.systemDefault();
        }
    }

    public ZoneId getZone() {
        return zone();
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByDateDesc();
    }

    public Optional<Order> getOrderById(String id) {
        return orderRepository.findById(id);
    }

    public List<Order> getOrdersByDay(Date date) {
        if (date == null) return new java.util.ArrayList<>();
        Calendar cal = Calendar.getInstance(java.util.TimeZone.getTimeZone(zone()));
        cal.setTime(date);
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date start = cal.getTime();

        cal.add(Calendar.DAY_OF_MONTH, 1);
        Date end = cal.getTime();

        // Borne haute exclue : evite de compter deux fois une commande tombant
        // exactement a minuit du jour suivant.
        return orderRepository.findByDateGreaterThanEqualAndDateLessThan(start, end);
    }

    public Order createOrder(Order order) {
        order.setId(null);
        if (order.getDate() == null) order.setDate(new Date());
        return orderRepository.save(order);
    }

    public Order updateOrderStatus(String id, String status) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(status);
            return orderRepository.save(order);
        }).orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id : " + id));
    }

    public void deleteOrder(String id) {
        if (!orderRepository.existsById(id)) {
            throw new RuntimeException("Commande non trouvée avec l'id : " + id);
        }
        orderRepository.deleteById(id);
    }

    public Double getDailyRevenue(Date date) {
        return getOrdersByDay(date).stream()
                .filter(o -> !"Annulée".equalsIgnoreCase(o.getStatus()))
                .mapToDouble(o -> o.getTotalAmount() == null ? 0.0 : o.getTotalAmount())
                .sum();
    }
}
