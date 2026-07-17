package com.rainbowforest.userservice.controller;

import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import java.util.ArrayList;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties =
        "security.jwt.secret=unit-test-only-secret-value-32-bytes")
@AutoConfigureMockMvc
@WithMockUser(username = "controller-test-admin", authorities = "ROLE_ADMIN")
public class UserControllerTests {

    private final Long USER_ID = 2L;
    private final String USER_NAME = "test";
    private User user;
    private List<User> users;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;
    
    @Test
    public void get_all_users_controller_should_return200_when_validRequest() throws Exception{	
        //given
        user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);
        users = new ArrayList<>();
        users.add(user);
        
        //when
        when(userService.getAllUsers()).thenReturn(users);
        
        //then
        mockMvc.perform(get("/users"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$[0].id").value(USER_ID))
        .andExpect(jsonPath("$[0].userName").value(USER_NAME));

        verify(userService, times(1)).getAllUsers();
        verifyNoMoreInteractions(userService);
    }

    @Test
    public void get_all_users_controller_should_return404_when_userList_isEmpty() throws Exception{
        //given
        List<User> users = new ArrayList<>();
        //when
        when(userService.getAllUsers()).thenReturn(users);
        
        //then
        mockMvc.perform(get("/users"))
        .andExpect(status().isNotFound())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

        verify(userService, times(1)).getAllUsers();
        verifyNoMoreInteractions(userService);
    }
    
    @Test
    public void get_user_by_name_controller_should_return200_when_users_isExist() throws Exception{
        //given
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);
        
        //when
        when(userService.getUserByName(USER_NAME)).thenReturn(user);
        
        //then
        mockMvc.perform(get("/users").param("name", USER_NAME))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.id").value(USER_ID))
        .andExpect(jsonPath("$.userName").value(USER_NAME));

        verify(userService, times(1)).getUserByName(anyString());
        verifyNoMoreInteractions(userService);
    }

    @Test
    public void get_user_by_name_controller_should_return404_when_users_is_notExist() throws Exception{
        //when
        when(userService.getUserByName(USER_NAME)).thenReturn(null);
        
        //then
        mockMvc.perform(get("/users").param("name", USER_NAME))
        .andExpect(status().isNotFound())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

        verify(userService, times(1)).getUserByName(anyString());
        verifyNoMoreInteractions(userService); 
    }
    
    @Test
    public void get_user_by_id_controller_should_return200_when_users_isExist() throws Exception{
        //given
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);
        
        //when
        when(userService.getUserById(USER_ID)).thenReturn(user);
        
        //then
        mockMvc.perform(get("/users/{id}", USER_ID))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.id").value(USER_ID))
        .andExpect(jsonPath("$.userName").value(USER_NAME));

        verify(userService, times(1)).getUserById(anyLong());
        verifyNoMoreInteractions(userService);
    }
    
    @Test
    public void get_user_by_id_controller_should_return404_when_users_is_notExist() throws Exception{
        //when
        when(userService.getUserById(USER_ID)).thenReturn(null);
        
        //then
        mockMvc.perform(get("/users/{id}", USER_ID))
        .andExpect(status().isNotFound())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

        verify(userService, times(1)).getUserById(anyLong());
        verifyNoMoreInteractions(userService);
    }
    
    @Test
    public void add_user_controller_should_return201_when_user_is_saved() throws Exception{
        //given
        User user = new User();
        user.setUserName(USER_NAME);
        user.setUserPassword("valid-password");
        String requestJson = """
                {"userName":"%s","email":"valid@example.com","userPassword":"valid-password"}
                """.formatted(USER_NAME);
        
        //when
        when(userService.saveUser(any(User.class))).thenReturn(user);
        
        //then
        mockMvc.perform(post("/users").content(requestJson).contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isCreated())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.userName").value(USER_NAME));
        
        verify(userService, times(1)).saveUser(any(User.class));
        verifyNoMoreInteractions(userService);
    }
    
    @Test
    public void add_user_controller_should_return400_when_user_isNull() throws Exception{
        //then
        mockMvc.perform(post("/users").content("null").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void get_all_admin_users_controller_should_return200_with_emptyList() throws Exception {
        // given
        when(userService.getAllUsers()).thenReturn(new ArrayList<>());

        // then
        mockMvc.perform(get("/admin/users"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$").isArray());

        verify(userService, times(1)).getAllUsers();
        verifyNoMoreInteractions(userService);
    }

    @Test
    public void get_admin_user_by_id_controller_should_return200_when_user_exists() throws Exception {
        // given
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);

        // when
        when(userService.getUserById(USER_ID)).thenReturn(user);

        // then
        mockMvc.perform(get("/admin/users/{id}", USER_ID))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.id").value(USER_ID))
        .andExpect(jsonPath("$.userName").value(USER_NAME));

        verify(userService, times(1)).getUserById(USER_ID);
        verifyNoMoreInteractions(userService);
    }

    @Test
    public void update_admin_user_status_controller_should_return200_when_user_exists() throws Exception {
        // given
        User user = new User();
        user.setId(USER_ID);
        user.setUserName(USER_NAME);
        user.setActive(0);

        // when
        when(userService.updateUserActive(USER_ID, false)).thenReturn(user);

        // then
        mockMvc.perform(put("/admin/users/{id}/status", USER_ID).param("active", "false"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.id").value(USER_ID))
        .andExpect(jsonPath("$.active").value(0));

        verify(userService, times(1)).updateUserActive(USER_ID, false);
        verifyNoMoreInteractions(userService);
    }

    @Test
    public void update_admin_user_status_controller_should_return404_when_user_missing() throws Exception {
        // when
        when(userService.updateUserActive(USER_ID, true)).thenReturn(null);

        // then
        mockMvc.perform(put("/admin/users/{id}/status", USER_ID).param("active", "true"))
        .andExpect(status().isNotFound());

        verify(userService, times(1)).updateUserActive(USER_ID, true);
        verifyNoMoreInteractions(userService);
    }
}
