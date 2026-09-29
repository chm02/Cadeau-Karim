package com.karimmarket.repositories;

import com.karimmarket.models.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByDateBetween(Date startDate, Date endDate);

    // Requete JSON explicite : la requete derivee leve
    // InvalidMongoDbApiUsageException ("can't add a second 'date' expression")
    // car les deux predicats portent sur le meme champ.
    @Query("{ 'date': { $gte: ?0, $lt: ?1 } }")
    List<Order> findByDateGreaterThanEqualAndDateLessThan(Date startDate, Date endDate);

    List<Order> findAllByOrderByDateDesc();
}
