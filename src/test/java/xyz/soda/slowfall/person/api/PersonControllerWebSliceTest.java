package xyz.soda.slowfall.person.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import xyz.soda.slowfall.person.application.PersonService;
import xyz.soda.slowfall.person.domain.Person;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PersonControllerWebSliceTest {

    MockMvc mockMvc;

    ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    PersonService service;

    @BeforeEach
    void setup() {
        PersonController controller = new PersonController(service);
        this.mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void createPersonReturnsCreated() throws Exception {
        CreatePersonRequest req = new CreatePersonRequest("A", "B", false, false, 70, "a@b.com");
        Person p = new Person("A", "B", false, false, 70, "a@b.com");
        when(service.createPerson(any(CreatePersonRequest.class))).thenReturn(p);

        mockMvc.perform(post("/api/people").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.email").value("a@b.com"));
    }

    @Test
    void listPeopleReturnsOk() throws Exception {
        Person p = new Person("A", "B", false, false, 70, "a@b.com");
        when(service.listAllPeople()).thenReturn(List.of(p));

        mockMvc.perform(get("/api/people")).andExpect(status().isOk()).andExpect(jsonPath("$[0].email").value("a@b.com"));
    }
}
