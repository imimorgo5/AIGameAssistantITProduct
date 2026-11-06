package ru.project.gameAssistantBackend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "token")
public class Token extends BaseEntity{

    private String body;

    @OneToOne
    @JoinColumn(name = "uzer_id", nullable = false, unique = true)
    private User user;

    public Token(User user, String body) {
        this.user = user;
        this.body = body;
    }

    public Token() {}

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
