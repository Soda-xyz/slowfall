package xyz.soda.slowfall.airport.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AirportControllerIntegrationTest {

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate restTemplate;

    @Test
    void createAndListAirportEndToEnd() {
        String url = "http://localhost:" + port + "/api/airports";

        CreateAirportRequest req = new CreateAirportRequest("Heathrow", "EGLL", "Europe/London");
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");

        ResponseEntity<AirportDto> postResp =
                restTemplate.postForEntity(url, new HttpEntity<>(req, headers), AirportDto.class);
        assertEquals(HttpStatus.CREATED, postResp.getStatusCode());
        AirportDto created = postResp.getBody();
        assertTrue(created != null && "Heathrow".equals(created.name()));

        ResponseEntity<AirportDto[]> listResp = restTemplate.getForEntity(url, AirportDto[].class);
        assertEquals(HttpStatus.OK, listResp.getStatusCode());
        AirportDto[] list = listResp.getBody();
        boolean found = false;
        if (list != null) {
            for (AirportDto d : list) {
                if ("Heathrow".equals(d.name())) {
                    found = true;
                    break;
                }
            }
        }
        assertTrue(found);
    }
}
