package backend.task;

import backend.user.User;
import backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import jakarta.transaction.Transactional;


import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.assertTrue;
/*
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // currenly using the user/DataInitializer for test
    @Test
    void shouldCreateTaskForExistingUser() throws Exception {

        // Get any existing user (from DataInitializer)
        User user = userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No users found"));

        String json = """
        {
          "task": {
            "name": "Take out trash",
            "description": "Kitchen trash",
            "points": 10,
            "timestamp": "2026-02-15T18:00:00",
            "repeatEvery": "Daily"
          },
          "userIds": [%d]
        }
        """.formatted(user.getId());

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());
    }

    @Test
    void shouldCreateTaskFromFlatCalendarPayload() throws Exception {

        User user = userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No users found"));

        String json = """
        {
          "title": "Calendar event",
          "description": "From quick create",
          "start": "2026-02-15T18:00:00",
          "end": "2026-02-15T19:00:00",
          "userIds": [%d]
        }
        """.formatted(user.getId());

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Calendar event"));
    }

    @Test
    void shouldRejectTaskWithoutUserIds() throws Exception {
        String json = """
        {
          "task": {
            "name": "No assignee",
            "description": "Missing userIds",
            "timestamp": "2026-02-15T18:00:00"
          }
        }
        """;

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldFetchTasksForUser() throws Exception {

        // Get existing user
        User user = userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No users found"));

        // Create task assigned to that user
        String createJson = """
    {
      "task": {
        "name": "Do homework",
        "description": "Math exercises",
        "points": 15,
        "timestamp": "2026-02-15T18:00:00",
        "repeatEvery": "Daily"
      },
      "userIds": [%d]
    }
    """.formatted(user.getId());

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson))
                .andExpect(status().isOk());

        // Fetch tasks for that user
        mockMvc.perform(get("/api/tasks/user/" + user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void shouldMarkTaskAsCompleted() throws Exception {

        // Get existing user
        User user = userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No users found"));

        // Create task
        String createJson = """
                {
                  "task": {
                    "name": "Clean room",
                    "description": "Bedroom cleanup",
                    "points": 20,
                    "timestamp": "2026-02-15T18:00:00",
                    "repeatEvery": "Daily"
                  },
                  "userIds": [%d]
                }
                """.formatted(user.getId());

        String response = mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract task ID from response
        Task createdTask = objectMapper.readValue(response, Task.class);

        // Mark as completed
        mockMvc.perform(put("/api/tasks/" + createdTask.getId() + "/complete"))
                .andExpect(status().isOk());

        // Verify it is completed
        String fetchResponse = mockMvc.perform(get("/api/tasks/user/" + user.getId()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Task[] tasks = objectMapper.readValue(fetchResponse, Task[].class);

        boolean foundCompleted = false;
        for (Task t : tasks) {
            if (t.getId().equals(createdTask.getId())
                    && Boolean.TRUE.equals(t.getChecked())) {
                foundCompleted = true;
                break;
            }
        }

        assertTrue(foundCompleted, "Task should be marked as completed");
    }
}
 */