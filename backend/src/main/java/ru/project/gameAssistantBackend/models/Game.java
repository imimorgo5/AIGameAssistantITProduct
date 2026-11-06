package ru.project.gameAssistantBackend.models;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "game")
public class Game extends BaseEntity{

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany
    @JoinTable(
            name = "game_category",
            joinColumns = @JoinColumn(name = "game_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<Category> categories = new HashSet<>();

    private String imageFileTitle;

    private String rulesFileTitle;

    @ManyToMany(mappedBy = "games")
    private Set<User> users = new HashSet<>();

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Chat> chats;

    public Game(Long id, String title, String description, Set<Category> categories, String imageFileTitle, String rulesFileTitle) {
        this.setId(id);
        this.title = title;
        this.description = description;
        this.categories = categories;
        this.imageFileTitle = imageFileTitle;
        this.rulesFileTitle = rulesFileTitle;
    }

    public Game() {}

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageFileTitle() {
        return imageFileTitle;
    }

    public void setImageFileTitle(String imageFileTitle) {
        this.imageFileTitle = imageFileTitle;
    }

    public String getRulesFileTitle() {
        return rulesFileTitle;
    }

    public void setRulesFileTitle(String rulesFileTitle) {
        this.rulesFileTitle = rulesFileTitle;
    }

    public Set<User> getUsers() {
        return users;
    }

    public void setUsers(Set<User> users) {
        this.users = users;
    }

    public Set<Chat> getChats() {
        return chats;
    }

    public void setChats(Set<Chat> chats) {
        this.chats = chats;
    }

    public Set<Category> getCategories() {
        return categories;
    }

    public void setCategories(Set<Category> gameCategory) {
        this.categories = gameCategory;
    }

    @Override
    public String toString() {
        return "Game{" +
                "id=" + getId() +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", gameCategory=" + categories +
                ", imageFileTitle='" + imageFileTitle + '\'' +
                ", rulesFileTitle='" + rulesFileTitle + '\'' +
                ", users=" + users +
                ", chats=" + chats +
                '}';
    }
}
