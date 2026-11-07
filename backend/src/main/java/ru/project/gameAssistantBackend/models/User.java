package ru.project.gameAssistantBackend.models;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "uzer")
public class User extends BaseEntity{

    private String email;

    private String login;

    private String password;

    private Role role;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Token refreshToken;

    private String imageFileTitle;

    private String model;

    private boolean enabled;

    private String verificationToken;

    private String passwordResetToken;

    private java.time.Instant passwordResetExpiresAt;

    public java.time.Instant getPasswordResetExpiresAt() { return passwordResetExpiresAt; }
    public void setPasswordResetExpiresAt(java.time.Instant value) { passwordResetExpiresAt = value; }

    @ManyToMany
    @JoinTable(
            name = "uzer_favourites",
            joinColumns = @JoinColumn(name = "uzer_id"),
            inverseJoinColumns = @JoinColumn(name = "game_id")
    )
    private Set<Game> games = new HashSet<>();

    @OneToMany(mappedBy = "uzer", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Chat> chats;

    public User(String email, String login, String password, Role role, String imageFileTitle) {
        this.email = email;
        this.login = login;
        this.password = password;
        this.role = role;
        this.imageFileTitle = imageFileTitle;
    }

    public User() {}

    public String getEmail() {
        return email;
    }

    public String getLogin() {
        return login;
    }

    public String getPassword() {
        return password;
    }

    public Role getRole() {
        return role;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRole(Role roles) {
        this.role = roles;
    }

    public Token getRefreshToken() {
        return refreshToken;
    }

    public String getImageFileTitle() {
        return imageFileTitle;
    }

    public void setImageFileTitle(String imageFileTitle) {
        this.imageFileTitle = imageFileTitle;
    }

    public Set<Game> getGames() {
        return games;
    }

    public void setGames(Set<Game> games) {
        this.games = games;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getVerificationToken() {
        return verificationToken;
    }

    public void setVerificationToken(String verificationToken) {
        this.verificationToken = verificationToken;
    }

    public String getPasswordResetToken() {
        return passwordResetToken;
    }

    public void setPasswordResetToken(String passwordResetToken) {
        this.passwordResetToken = passwordResetToken;
    }

    public void addGame(Game game) {
        games.add(game);
        game.getUsers().add(this);
    }

    public void removeGame(Game game) {
        games.remove(game);
        game.getUsers().remove(this);
    }

    public void setRefreshToken(Token token) {
        this.refreshToken = token;
        if (token != null) {
            token.setUser(this);
        }
    }
}
