package com.karimmarket.controllers;

import com.karimmarket.models.Order;
import com.karimmarket.services.OrderService;
import com.karimmarket.services.PdfReportService;
import com.karimmarket.services.AdminTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private PdfReportService pdfReportService;

    @Autowired
    private AdminTokenService adminTokenService;

    @Value("${app.orders.minimum-amount:50.0}")
    private Double minimumOrderAmount;

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable String id) {
        return orderService.getOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-day")
    public ResponseEntity<List<Order>> getOrdersByDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(orderService.getOrdersByDay(toDate(date)));
    }

    @GetMapping("/by-day/summary")
    public ResponseEntity<Map<String, Object>> getOrdersByDaySummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Date day = toDate(date);
        List<Order> orders = orderService.getOrdersByDay(day);
        Double revenue = orderService.getDailyRevenue(day);

        Map<String, Object> summary = new HashMap<>();
        summary.put("date", day);
        summary.put("ordersCount", orders.size());
        summary.put("revenue", revenue);
        summary.put("orders", orders);
        return ResponseEntity.ok(summary);
    }

    /**
     * Convertit une date "yyyy-MM-dd" en Date au DEBUT de la journee du
     * fuseau de reference. Sans cela, Spring interpretait la date en UTC et
     * une commande de fin de journee pouvait disparaitre du rapport du jour.
     */
    private Date toDate(LocalDate date) {
        return Date.from(date.atStartOfDay(orderService.getZone()).toInstant());
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
        double subtotal = order.getSubtotalAmount() != null
            ? order.getSubtotalAmount()
            : (order.getTotalAmount() != null ? order.getTotalAmount() : 0.0);
        double deliveryFee = subtotal >= minimumOrderAmount ? 0.0 : 10.0;
        order.setSubtotalAmount(subtotal);
        order.setDeliveryFee(deliveryFee);
        order.setTotalAmount(subtotal + deliveryFee);
        if (order.getStatus() == null || order.getStatus().isBlank()) order.setStatus("Validée");
        Order created = orderService.createOrder(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateOrderForWhatsapp(@RequestBody Map<String, Object> body) {
        Object subtotalObj = body.get("subtotalAmount");
        Object totalObj = body.get("totalAmount");
        double subtotal = subtotalObj instanceof Number
            ? ((Number) subtotalObj).doubleValue()
            : (totalObj instanceof Number ? ((Number) totalObj).doubleValue() : 0.0);
        double deliveryFee = subtotal >= minimumOrderAmount ? 0.0 : 10.0;
        Map<String, Object> res = new HashMap<>();
        res.put("minimumOrderAmount", minimumOrderAmount);
        res.put("currentTotal", subtotal + deliveryFee);
        res.put("subtotalAmount", subtotal);
        res.put("valid", subtotal > 0);
        res.put("deliveryFree", deliveryFee == 0);
        res.put("deliveryFee", deliveryFee);
        res.put("message", deliveryFee == 0
            ? "Commande validée avec livraison gratuite."
            : "Commande validée avec frais de livraison de 10 DH.");
        return ResponseEntity.ok(res);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable String id,
                                                   @RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                   @RequestBody Map<String, String> body) {
        if (!adminTokenService.isValid(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            String status = body.getOrDefault("status", "Validée");
            return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable String id,
                                            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!adminTokenService.isValid(token)) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            orderService.deleteOrder(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/by-day/pdf")
    public ResponseEntity<byte[]> getDailyPdfReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateParam) {
        try {
            Date date = toDate(dateParam);
            List<Order> orders = orderService.getOrdersByDay(date);
            Double revenue = orderService.getDailyRevenue(date);
            byte[] pdfBytes = pdfReportService.generateDailyReport(date, orders, revenue);

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            sdf.setTimeZone(TimeZone.getTimeZone(orderService.getZone()));
            String filename = "rapport-" + sdf.format(date) + ".pdf";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
