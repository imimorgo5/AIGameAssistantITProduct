package ru.project.gameAssistantBackend.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;

class EmailServiceTest {
    @ParameterizedTest
    @ValueSource(strings = {"AIGameAssistant", "Игровой ассистент, правила"})
    void confirmationIncludesSenderNameAndPreservesAddress(String senderName) throws Exception {
        var sender = mock(JavaMailSender.class);
        var service = new EmailService(sender, "https://game.example", "sender@example.com", senderName);

        service.sendEmailConfirmEmail("player@example.com", "confirmation-token");

        var message = prepareMessage(sender);
        var from = assertInstanceOf(InternetAddress.class, message.getFrom()[0]);
        assertEquals(senderName, from.getPersonal());
        assertEquals("sender@example.com", from.getAddress());
        assertEquals("player@example.com", ((InternetAddress) message.getAllRecipients()[0]).getAddress());
        assertEquals("AI Game Assistant: Подтверждение почты", message.getSubject());
        assertTrue(message.getContent().toString().contains("https://game.example/verify-email?token=confirmation-token"));
    }

    @Test
    void passwordResetAlsoUsesServiceName() throws Exception {
        var sender = mock(JavaMailSender.class);
        var service = new EmailService(sender, "https://game.example", "sender@example.com", "AIGameAssistant");

        service.sendPasswordResetEmail("player@example.com", "reset-token");

        var message = prepareMessage(sender);
        var from = assertInstanceOf(InternetAddress.class, message.getFrom()[0]);
        assertEquals("AIGameAssistant", from.getPersonal());
        assertTrue(message.getContent().toString().contains("https://game.example/reset-password?token=reset-token"));
    }

    private MimeMessage prepareMessage(JavaMailSender sender) throws Exception {
        var preparator = ArgumentCaptor.forClass(MimeMessagePreparator.class);
        verify(sender).send(preparator.capture());
        var message = new MimeMessage((Session) null);
        preparator.getValue().prepare(message);
        message.saveChanges();
        // Round-trip through the wire format to verify UTF-8 names and subjects.
        var bytes = new java.io.ByteArrayOutputStream();
        message.writeTo(bytes);
        return new MimeMessage((Session) null, new java.io.ByteArrayInputStream(bytes.toByteArray()));
    }
}
