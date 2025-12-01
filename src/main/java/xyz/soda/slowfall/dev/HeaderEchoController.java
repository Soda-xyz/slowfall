package xyz.soda.slowfall.dev;

import java.util.Map;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@Profile("dev")
@RestController
public class HeaderEchoController {
    @GetMapping("/internal/echo-headers")
    public Map<String, String> echo(@RequestHeader Map<String, String> headers) {
        return headers;
    }
}
