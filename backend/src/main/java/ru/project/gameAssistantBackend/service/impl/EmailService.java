package ru.project.gameAssistantBackend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String publicUrl;
    private final String from;
    private final String senderName;

    @Autowired
    public EmailService(JavaMailSender mailSender, @Value("${app.public-url}") String publicUrl,
                        @Value("${spring.mail.username:noreply@example.com}") String from,
                        @Value("${app.mail.sender-name:AIGameAssistant}") String senderName) {
        this.mailSender = mailSender;
        this.publicUrl = publicUrl;
        this.from = from;
        this.senderName = senderName;
    }

    public void sendEmail(String to, String subject, String text) {
        mailSender.send(message -> {
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setFrom(from, senderName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text);
        });
    }

    public void sendPasswordResetEmail(String email, String token) {
        String passwordResetUrl = publicUrl + "/reset-password?token=" + token;
        sendEmail(
                email,
                "AI Game Assistant: Сброс пароля",
                "Для сброса пароля перейдите по ссылке: " + passwordResetUrl
        );
    }

    public void sendEmailConfirmEmail(String email, String token) {
        String confirmationUrl = publicUrl + "/verify-email?token=" + token;
        sendEmail(
                email,
                "AI Game Assistant: Подтверждение почты",
                "Для подтверждения почты перейдите по ссылке: " + confirmationUrl
        );
    }
}
