package xyz.soda.slowfall.airport.api;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/airports")
@CrossOrigin(origins = "http://localhost:5173") // frontend dev server
public class AirportController {

    
}
