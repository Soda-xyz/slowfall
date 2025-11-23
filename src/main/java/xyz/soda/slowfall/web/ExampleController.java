package xyz.soda.slowfall.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/example")
public class ExampleController {

    @GetMapping
    public ResponseEntity<Greeting> get() {
        return ResponseEntity.ok(new Greeting("hello"));
    }

    public record Greeting(String name) {
    }
}

