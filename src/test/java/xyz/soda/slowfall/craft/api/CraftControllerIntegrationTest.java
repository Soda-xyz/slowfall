package xyz.soda.slowfall.craft.api;

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
class CraftControllerIntegrationTest {

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate restTemplate;

    @Test
    void createAndListCraftEndToEnd() {
        String url = "http://localhost:" + port + "/api/crafts";

        CreateCraftRequest req = new CreateCraftRequest("C1", "REG-1", 1000, 4);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");

        ResponseEntity<CraftDto> postResp =
                restTemplate.postForEntity(url, new HttpEntity<>(req, headers), CraftDto.class);
        assertEquals(HttpStatus.CREATED, postResp.getStatusCode());
        CraftDto created = postResp.getBody();
        assertTrue(created != null && "C1".equals(created.name()));
    }

    @Test
    void duplicateCreateReturnsBadRequest() {
        String url = "http://localhost:" + port + "/api/crafts";
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");

        CreateCraftRequest req1 = new CreateCraftRequest("C-DUP", "REG-DUP", 1000, 4);
        ResponseEntity<CraftDto> r1 = restTemplate.postForEntity(url, new HttpEntity<>(req1, headers), CraftDto.class);
        assertEquals(HttpStatus.CREATED, r1.getStatusCode());

        // attempt duplicate by registration number
        CreateCraftRequest req2 = new CreateCraftRequest("C-NEW", "REG-DUP", 1100, 5);
        ResponseEntity<String> r2 = restTemplate.postForEntity(url, new HttpEntity<>(req2, headers), String.class);
        assertEquals(HttpStatus.BAD_REQUEST, r2.getStatusCode());
    }

    @Test
    void invalidPayloadReturnsBadRequest() {
        String url = "http://localhost:" + port + "/api/crafts";
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");

        // blank name
        CreateCraftRequest req = new CreateCraftRequest("   ", "REG-1", 1000, 4);
        ResponseEntity<String> r = restTemplate.postForEntity(url, new HttpEntity<>(req, headers), String.class);
        assertEquals(HttpStatus.BAD_REQUEST, r.getStatusCode());
    }
}
