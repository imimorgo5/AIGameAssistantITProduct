package ru.project.gameAssistantBackend.ai;

public record GenerationResult(String text, String modelId, String remoteModel, String provider,
                               Integer inputTokens, Integer outputTokens, long durationMs) {}
