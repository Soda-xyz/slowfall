package xyz.soda.slowfall.airport.api;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
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
import xyz.soda.slowfall.airport.application.AirportService;
import xyz.soda.slowfall.airport.domain.Airport;

@ExtendWith(MockitoExtension.class)
class AirportControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    AirportService service;

    private MockMvc mvc;

    @BeforeEach
    void setup() {
        var controller = new AirportController(service);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .setValidator(new LocalValidatorFactoryBean())
                .build();
    }

    @Test
    void createAirportReturns201AndBody() throws Exception {
        // Arrange
        CreateAirportRequest req = new CreateAirportRequest("Heathrow", "EGLL", "Europe/London");
        Airport saved = new Airport("EGLL", "Heathrow", "Europe/London");
        // ensure id is non-null for dto
        java.lang.reflect.Field idField = Airport.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(saved, UUID.randomUUID());

        when(service.createAirport(any(CreateAirportRequest.class))).thenReturn(saved);

        // Act & Assert
        mvc.perform(post("/api/airports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Heathrow"))
                .andExpect(jsonPath("$.icaoCode").value("EGLL"));
    }

    @Test
    void createAirportBadRequestOnInvalidPayload() throws Exception {
        // missing name (blank)
        CreateAirportRequest req = new CreateAirportRequest("   ", "EGLL", "Europe/London");

        mvc.perform(post("/api/airports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createAirportReturns400WhenServiceThrows() throws Exception {
        CreateAirportRequest req = new CreateAirportRequest("Heathrow", "EGLL", "Europe/London");
        when(service.createAirport(any(CreateAirportRequest.class)))
                .thenThrow(new IllegalArgumentException("service error"));

        mvc.perform(post("/api/airports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listAirportsReturnsDtos() throws Exception {
        Airport a = new Airport("EGLL", "Heathrow", "Europe/London");
        java.lang.reflect.Field idField = Airport.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(a, UUID.randomUUID());

        when(service.listAllAirports()).thenReturn(List.of(a));

        mvc.perform(get("/api/airports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Heathrow"));
    }
}
