package ru.project.gameAssistantBackend.models;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "category")
public class Category extends BaseEntity{

    private String name;

    @ManyToMany(mappedBy = "categories")
    private Set<Game> games = new HashSet<>();

    public Category(Long id, String name) {
        this.setId(id);
        this.name = name;
    }

    public Category() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
