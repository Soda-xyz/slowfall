package xyz.soda.slowfall.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = "spring.profiles.active=dev")
@AutoConfigureMockMvc
public class CraftControllerSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    private String getAccessToken() throws Exception {
        ObjectMapper om = new ObjectMapper();
        String payload = om.writeValueAsString(new xyz.soda.slowfall.auth.AuthController.LoginRequest("dev", "devpass"));
        MvcResult r = mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk())
                .andReturn();
        String body = r.getResponse().getContentAsString();
        JsonNode node = om.readTree(body);
        return node.get("accessToken").asText();
    }

    @Test
    void listCrafts_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/crafts")).andExpect(status().isUnauthorized());
    }

    @Test
    void listCrafts_authenticated_returns200() throws Exception {
        String token = getAccessToken();
        mockMvc.perform(get("/api/crafts").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void createCraft_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/crafts").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createCraft_authenticated_canCreate_badRequestOnEmpty() throws Exception {
        String token = getAccessToken();
        mockMvc.perform(post("/api/crafts")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
