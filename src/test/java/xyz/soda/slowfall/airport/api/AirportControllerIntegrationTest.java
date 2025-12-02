package xyz.soda.slowfall.airport.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
class AirportControllerIntegrationTest {

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
    void createAndListAirportEndToEnd() throws Exception {
        String url = "http://localhost:" + port + "/api/airports";

        CreateAirportRequest req = new CreateAirportRequest("Heathrow", "EGLL", "Europe/London");
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");

        String token = obtainAccessToken();
        headers.add("Authorization", "Bearer " + token);

        ResponseEntity<AirportDto> postResp =
                restTemplate.postForEntity(url, new HttpEntity<>(req, headers), AirportDto.class);
        assertEquals(HttpStatus.CREATED, postResp.getStatusCode());
        AirportDto created = postResp.getBody();
        assertTrue(created != null && "Heathrow".equals(created.name()));

        // use same bearer token for GET as well
        HttpHeaders getHeaders = new HttpHeaders();
        getHeaders.add("Authorization", "Bearer " + token);
        ResponseEntity<AirportDto[]> listResp = restTemplate.exchange(
                url, org.springframework.http.HttpMethod.GET, new HttpEntity<>(null, getHeaders), AirportDto[].class);
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
