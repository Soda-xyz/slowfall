package xyz.soda.slowfall.airport.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
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
        headers.add("Authorization", "Basic ZGV2OmRldnBhc3M=");

        ResponseEntity<AirportDto> postResp = restTemplate.postForEntity(
                url, new org.springframework.http.HttpEntity<>(req, headers), AirportDto.class);
        assertEquals(HttpStatus.CREATED, postResp.getStatusCode());
        AirportDto created = postResp.getBody();
        assertTrue(created != null && "Heathrow".equals(created.name()));

        // use authenticated rest template for the GET as well so security allows the request
        ResponseEntity<AirportDto[]> listResp =
                restTemplate.withBasicAuth("dev", "devpass").getForEntity(url, AirportDto[].class);
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
