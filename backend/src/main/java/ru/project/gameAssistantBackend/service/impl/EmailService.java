package ru.project.gameAssistantBackend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String publicUrl;
    private final String from;

    @Autowired
    public EmailService(JavaMailSender mailSender, @Value("${app.public-url}") String publicUrl,
                        @Value("${spring.mail.username:noreply@example.com}") String from) {
        this.mailSender = mailSender;
        this.publicUrl = publicUrl;
        this.from = from;
    }

    public void sendEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
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
