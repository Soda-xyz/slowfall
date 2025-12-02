package xyz.soda.slowfall.jump.api;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import xyz.soda.slowfall.airport.api.CreateAirportRequest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
class JumpControllerIntegrationTest {

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate restTemplate;

    private String obtainAccessToken() throws Exception {
        ObjectMapper om = new ObjectMapper();
        var req = new xyz.soda.slowfall.auth.AuthController.LoginRequest("dev", "devpass");
        ResponseEntity<String> resp =
                restTemplate.postForEntity("http://localhost:" + port + "/auth/login", req, String.class);
        if (resp.getStatusCode() != HttpStatus.OK) {
            throw new IllegalStateException("Failed to login: " + resp.getStatusCode());
        }
        JsonNode node = om.readTree(resp.getBody());
        return node.get("accessToken").asText();
    }

    @Test
    void createJumpEndToEnd() throws Exception {
        String airportUrl = "http://localhost:" + port + "/api/airports";
        CreateAirportRequest areq = new CreateAirportRequest("Heathrow", "EGLL", "UTC");
        String token = obtainAccessToken();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + token);
        restTemplate.postForEntity(airportUrl, new HttpEntity<>(areq, headers), Object.class);

        // fetch created airport id
        ResponseEntity<Object[]> listResp = restTemplate.exchange(
                airportUrl, org.springframework.http.HttpMethod.GET, new HttpEntity<>(null, headers), Object[].class);
        Object[] airports = listResp.getBody();
        assertTrue(airports != null && airports.length > 0);
        java.util.Map<?, ?> first = (java.util.Map<?, ?>) airports[0];
        UUID airportId = UUID.fromString((String) first.get("id"));

        String jumpUrl = "http://localhost:" + port + "/api/jumps";
        CreateJumpRequest jreq =
                new CreateJumpRequest(Instant.now().plus(Duration.ofDays(1)), airportId, "REG-1", 12000, null);

        ResponseEntity<JumpDto> postResp =
                restTemplate.postForEntity(jumpUrl, new HttpEntity<>(jreq, headers), JumpDto.class);
        assertEquals(HttpStatus.CREATED, postResp.getStatusCode());
        JumpDto created = postResp.getBody();
        assertTrue(created != null && created.altitudeFeet().equals(12000));
    }

    @Test
    void addSkydiverIntegration() throws Exception {
        String airportUrl = "http://localhost:" + port + "/api/airports";
        CreateAirportRequest areq = new CreateAirportRequest("Heathrow", "EGLL", "UTC");
        String token = obtainAccessToken();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + token);
        restTemplate.postForEntity(airportUrl, new HttpEntity<>(areq, headers), Object.class);

        ResponseEntity<Object[]> listResp = restTemplate.exchange(
                airportUrl, org.springframework.http.HttpMethod.GET, new HttpEntity<>(null, headers), Object[].class);
        Object[] airports = listResp.getBody();
        assertTrue(airports != null && airports.length > 0);
        java.util.Map<?, ?> first = (java.util.Map<?, ?>) airports[0];
        UUID airportId = UUID.fromString((String) first.get("id"));

        String jumpUrl = "http://localhost:" + port + "/api/jumps";
        CreateJumpRequest jreq =
                new CreateJumpRequest(Instant.now().plus(Duration.ofDays(1)), airportId, "REG-1", 12000, null);
        ResponseEntity<JumpDto> postResp =
                restTemplate.postForEntity(jumpUrl, new HttpEntity<>(jreq, headers), JumpDto.class);
        assertEquals(HttpStatus.CREATED, postResp.getStatusCode());
        JumpDto created = postResp.getBody();
        assertNotNull(created);
        UUID jumpId = created.id();

        // attempt to add non-existent person -> expect 400
        String addSkydiverUrl = jumpUrl + "/" + jumpId + "/skydivers";
        var body = java.util.Map.of("personId", UUID.randomUUID());
        ResponseEntity<String> addResp =
                restTemplate.postForEntity(addSkydiverUrl, new HttpEntity<>(body, headers), String.class);
        assertEquals(HttpStatus.BAD_REQUEST, addResp.getStatusCode());
    }
}
