package com.karimmarket.models;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "orders")
public class Order {
    @Id
    private String id;

    @Builder.Default
    @Field("date")
    private Date date = new Date();

    @NotEmpty(message = "La commande doit contenir au moins un article")
    @Valid
    @Builder.Default
    @Field("items")
    private List<OrderItem> items = new ArrayList<>();

    @NotNull
    @Positive
    @Field("totalAmount")
    private Double totalAmount;

    @Field("subtotalAmount")
    private Double subtotalAmount;

    @Field("deliveryFee")
    private Double deliveryFee;

    @Builder.Default
    @Field("status")
    private String status = "Validée";
}
