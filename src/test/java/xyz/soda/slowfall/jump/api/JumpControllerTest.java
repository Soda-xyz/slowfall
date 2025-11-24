package xyz.soda.slowfall.jump.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
import xyz.soda.slowfall.jump.application.JumpService;
import xyz.soda.slowfall.jump.domain.Jump;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class JumpControllerTest {

    // ObjectMapper configured with JavaTimeModule so LocalDateTime is supported in tests
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Mock
    JumpService service;

    private MockMvc mvc;

    @BeforeEach
    void setup() {
        var controller = new JumpController(service);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .setValidator(new LocalValidatorFactoryBean())
                .build();
    }

    @Test
    void createJumpReturns201AndBody() throws Exception {
        LocalDateTime when = LocalDateTime.now().plusDays(1);
        UUID airportId = UUID.randomUUID();
        CreateJumpRequest req = new CreateJumpRequest(when, airportId, "REG-1", 12000, null);

        Jump saved = new Jump(when, airportId, 12000);
        java.lang.reflect.Field idField = Jump.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(saved, UUID.randomUUID());

        when(service.createJump(any(CreateJumpRequest.class))).thenReturn(saved);

        mvc.perform(post("/api/jumps")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.altitudeFeet").value(12000));
    }

    @Test
    void createJumpBadRequestOnInvalidPayload() throws Exception {
        // null airportId -> invalid
        CreateJumpRequest req = new CreateJumpRequest(LocalDateTime.now().plusDays(1), null, "REG-1", 12000, null);

        mvc.perform(post("/api/jumps")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createJumpReturns400WhenServiceThrows() throws Exception {
        LocalDateTime when = LocalDateTime.now().plusDays(1);
        UUID airportId = UUID.randomUUID();
        CreateJumpRequest req = new CreateJumpRequest(when, airportId, "REG-1", 12000, null);

        when(service.createJump(any(CreateJumpRequest.class)))
                .thenThrow(new IllegalArgumentException("airport not found"));

        mvc.perform(post("/api/jumps")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addSkydiverAndPilotEndpoints() throws Exception {
        UUID jumpId = UUID.randomUUID();
        UUID personId = UUID.randomUUID();

        // successful add skydiver (mock service does nothing => OK)
        mvc.perform(post("/api/jumps/" + jumpId + "/skydivers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("personId", personId))))
                .andExpect(status().isOk());

        // missing personId -> bad request
        mvc.perform(post("/api/jumps/" + jumpId + "/pilots")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listJumpsReturnsDtos() throws Exception {
        when(service.listAllJumps()).thenReturn(java.util.List.of());

        mvc.perform(get("/api/jumps")).andExpect(status().isOk());
    }
}
