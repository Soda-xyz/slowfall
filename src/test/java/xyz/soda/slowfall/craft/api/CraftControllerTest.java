package xyz.soda.slowfall.craft.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import xyz.soda.slowfall.craft.application.CraftService;
import xyz.soda.slowfall.craft.domain.Craft;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CraftControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    @Mock
    CraftService service;
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        var controller = new CraftController(service);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .setValidator(new LocalValidatorFactoryBean())
                .build();
    }

    @Test
    void createCraftReturns201AndBody() throws Exception {
        CreateCraftRequest req = new CreateCraftRequest("C1", "REG-1", 1000, 4);
        Craft saved = new Craft("C1", "REG-1", 1000, 4);
        java.lang.reflect.Field idField = Craft.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(saved, UUID.randomUUID());

        when(service.createCraft(any(CreateCraftRequest.class))).thenReturn(saved);

        mvc.perform(post("/api/crafts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("C1"))
                .andExpect(jsonPath("$.registrationNumber").value("REG-1"));
    }

    @Test
    void createCraftBadRequestOnInvalidPayload() throws Exception {
        // invalid name (blank)
        CreateCraftRequest req = new CreateCraftRequest("   ", "REG-1", 1000, 4);

        mvc.perform(post("/api/crafts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createCraftReturns400WhenServiceThrows() throws Exception {
        CreateCraftRequest req = new CreateCraftRequest("C1", "REG-1", 1000, 4);
        when(service.createCraft(any(CreateCraftRequest.class))).thenThrow(new IllegalArgumentException("exists"));

        mvc.perform(post("/api/crafts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }
}
