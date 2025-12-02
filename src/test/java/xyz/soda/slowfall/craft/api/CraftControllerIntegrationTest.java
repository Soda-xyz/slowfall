package xyz.soda.slowfall.craft.api;

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
class CraftControllerIntegrationTest {

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
    void createAndListCraftEndToEnd() throws Exception {
        String url = "http://localhost:" + port + "/api/crafts";

        CreateCraftRequest req = new CreateCraftRequest("C1", "REG-1", 1000, 4);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        String token = obtainAccessToken();
        headers.add("Authorization", "Bearer " + token);

        ResponseEntity<CraftDto> postResp =
                restTemplate.postForEntity(url, new HttpEntity<>(req, headers), CraftDto.class);
        assertEquals(HttpStatus.CREATED, postResp.getStatusCode());
        CraftDto created = postResp.getBody();
        assertTrue(created != null && "C1".equals(created.name()));
    }

    @Test
    void duplicateCreateReturnsBadRequest() throws Exception {
        String url = "http://localhost:" + port + "/api/crafts";
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        String token = obtainAccessToken();
        headers.add("Authorization", "Bearer " + token);

        CreateCraftRequest req1 = new CreateCraftRequest("C-DUP", "REG-DUP", 1000, 4);
        ResponseEntity<CraftDto> r1 = restTemplate.postForEntity(url, new HttpEntity<>(req1, headers), CraftDto.class);
        assertEquals(HttpStatus.CREATED, r1.getStatusCode());

        // attempt duplicate by registration number
        CreateCraftRequest req2 = new CreateCraftRequest("C-NEW", "REG-DUP", 1100, 5);
        ResponseEntity<String> r2 = restTemplate.postForEntity(url, new HttpEntity<>(req2, headers), String.class);
        assertEquals(HttpStatus.BAD_REQUEST, r2.getStatusCode());
    }

    @Test
    void invalidPayloadReturnsBadRequest() throws Exception {
        String url = "http://localhost:" + port + "/api/crafts";
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        String token = obtainAccessToken();
        headers.add("Authorization", "Bearer " + token);

        // blank name
        CreateCraftRequest req = new CreateCraftRequest("   ", "REG-1", 1000, 4);
        ResponseEntity<String> r = restTemplate.postForEntity(url, new HttpEntity<>(req, headers), String.class);
        assertEquals(HttpStatus.BAD_REQUEST, r.getStatusCode());
    }
}
