package xyz.soda.slowfall.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ExampleController.class)
class ExampleControllerWebSliceTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void getReturnsGreeting() throws Exception {
        mockMvc.perform(get("/api/example")).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("hello"));
    }
}

