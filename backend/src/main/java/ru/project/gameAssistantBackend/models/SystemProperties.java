package ru.project.gameAssistantBackend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "system_properties")
public class SystemProperties extends BaseEntity {

    private String prompt;

    private String model;

    public SystemProperties(Long id, String prompt, String model) {
        this.setId(id);
        this.prompt = prompt;
        this.model = model;
    }

    public SystemProperties() {}

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String text) {
        this.prompt = text;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }
}
