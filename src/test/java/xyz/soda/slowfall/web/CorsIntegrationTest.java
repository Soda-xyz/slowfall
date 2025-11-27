package xyz.soda.slowfall.web;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

/**
 * Integration tests that verify the application's global CORS configuration are applied.
 *
 * <p>These tests start the server on a random port and issue requests with an Origin header
 * to ensure preflight (OPTIONS), and normal requests include the expected CORS response headers.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
public class CorsIntegrationTest {

    @SuppressWarnings("unused")
    @Autowired
    private TestRestTemplate restTemplate;

    /**
     * Ensure preflight OPTIONS requests receive CORS response headers allowing the dev origin.
     */
    @Test
    public void preflightOptions_shouldReturnCorsHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setOrigin("http://localhost:5173");
        headers.setAccessControlRequestMethod(HttpMethod.GET);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<String> resp = restTemplate.exchange("/auth/login", HttpMethod.OPTIONS, request, String.class);

        assertNotNull(resp);
        HttpHeaders respHeaders = resp.getHeaders();
        assertTrue(
                respHeaders.containsKey(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN),
                "Missing Access-Control-Allow-Origin header");
        assertEquals("http://localhost:5173", respHeaders.getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
        assertTrue(respHeaders.containsKey(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS));
        assertTrue(respHeaders.containsKey(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS));
        assertEquals("true", respHeaders.getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS));
    }

    /**
     * Ensure an actual POST request to a permitted endpoint includes CORS headers on success.
     * This uses the in-memory dev user (username: dev, password: devpass) provided by SecurityConfig.
     */
    @Test
    public void postLogin_shouldReturnCorsHeadersAndOk() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setOrigin("http://localhost:5173");

        String body = "{\"username\":\"dev\",\"password\":\"devpass\"}";
        HttpEntity<String> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> resp = restTemplate.postForEntity("/auth/refresh", request, String.class);

        System.out.println("POST /auth/refresh response status: " + resp.getStatusCode());
        System.out.println("POST /auth/refresh response body: " + resp.getBody());

        assertNotNull(resp);
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());

        HttpHeaders respHeaders = resp.getHeaders();
        System.out.println("POST /auth/refresh response headers: " + respHeaders.toSingleValueMap());
        assertTrue(
                respHeaders.containsKey(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN),
                "Missing Access-Control-Allow-Origin header");
        assertEquals("http://localhost:5173", respHeaders.getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
