package xyz.soda.slowfall.jump.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import xyz.soda.slowfall.airport.api.CreateAirportRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
class JumpControllerIntegrationTest {

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate restTemplate;

    @Test
    void createJumpEndToEnd() {
        String airportUrl = "http://localhost:" + port + "/api/airports";
        CreateAirportRequest areq = new CreateAirportRequest("Heathrow", "EGLL", "UTC");
        restTemplate.withBasicAuth("dev", "devpass").postForEntity(airportUrl, areq, Object.class);

        // fetch created airport id
        ResponseEntity<Object[]> listResp =
                restTemplate.withBasicAuth("dev", "devpass").getForEntity(airportUrl, Object[].class);
        Object[] airports = listResp.getBody();
        assertTrue(airports != null && airports.length > 0);
        java.util.Map<?, ?> first = (java.util.Map<?, ?>) airports[0];
        UUID airportId = UUID.fromString((String) first.get("id"));

        String jumpUrl = "http://localhost:" + port + "/api/jumps";
        CreateJumpRequest jreq =
                new CreateJumpRequest(Instant.now().plus(Duration.ofDays(1)), airportId, "REG-1", 12000, null);

        ResponseEntity<JumpDto> postResp =
                restTemplate.withBasicAuth("dev", "devpass").postForEntity(jumpUrl, jreq, JumpDto.class);
        assertEquals(HttpStatus.CREATED, postResp.getStatusCode());
        JumpDto created = postResp.getBody();
        assertTrue(created != null && created.altitudeFeet().equals(12000));
    }

    @Test
    void addSkydiverIntegration() {
        String airportUrl = "http://localhost:" + port + "/api/airports";
        CreateAirportRequest areq = new CreateAirportRequest("Heathrow", "EGLL", "UTC");
        restTemplate.withBasicAuth("dev", "devpass").postForEntity(airportUrl, areq, Object.class);

        ResponseEntity<Object[]> listResp =
                restTemplate.withBasicAuth("dev", "devpass").getForEntity(airportUrl, Object[].class);
        Object[] airports = listResp.getBody();
        assertTrue(airports != null && airports.length > 0);
        java.util.Map<?, ?> first = (java.util.Map<?, ?>) airports[0];
        UUID airportId = UUID.fromString((String) first.get("id"));

        String jumpUrl = "http://localhost:" + port + "/api/jumps";
        CreateJumpRequest jreq =
                new CreateJumpRequest(Instant.now().plus(Duration.ofDays(1)), airportId, "REG-1", 12000, null);
        ResponseEntity<JumpDto> postResp =
                restTemplate.withBasicAuth("dev", "devpass").postForEntity(jumpUrl, jreq, JumpDto.class);
        assertEquals(HttpStatus.CREATED, postResp.getStatusCode());
        JumpDto created = postResp.getBody();
        assertNotNull(created);
        UUID jumpId = created.id();

        // attempt to add non-existent person -> expect 400
        String addSkydiverUrl = jumpUrl + "/" + jumpId + "/skydivers";
        var body = java.util.Map.of("personId", UUID.randomUUID());
        ResponseEntity<String> addResp =
                restTemplate.withBasicAuth("dev", "devpass").postForEntity(addSkydiverUrl, body, String.class);
        assertEquals(HttpStatus.BAD_REQUEST, addResp.getStatusCode());
    }
}
