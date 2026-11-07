package ru.project.gameAssistantBackend.exception.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.security.access.AccessDeniedException;
import ru.project.gameAssistantBackend.dto.ResponseDTO;
import ru.project.gameAssistantBackend.exception.customEx.notEnabled.AccountNotEnabledException;
import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantConflictException;
import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantInvalidException;
import ru.project.gameAssistantBackend.exception.globalEx.GameAssistantNotFoundException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(GameAssistantNotFoundException.class)
    public ResponseEntity<ResponseDTO> handleNotFoundEx(GameAssistantNotFoundException ex) {
        logger.error("NotFoundException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(ex.getMessage()));
    }

    @ExceptionHandler(GameAssistantConflictException.class)
    public ResponseEntity<ResponseDTO> handleConflictEx(GameAssistantConflictException ex) {
        logger.error("ConflictException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ResponseDTO(ex.getMessage()));
    }

    @ExceptionHandler(GameAssistantInvalidException.class)
    public ResponseEntity<ResponseDTO> handleInvalidException(GameAssistantInvalidException ex) {
        logger.error("InvalidException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseDTO(ex.getMessage()));
    }

    @ExceptionHandler(AccountNotEnabledException.class)
    public ResponseEntity<ResponseDTO> handleNotEnabledException(AccountNotEnabledException ex) {
        logger.error("AccountNotEnabledException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ResponseDTO(ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResponseDTO> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ResponseDTO("Доступ запрещён"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResponseDTO> handleInvalidInput(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(new ResponseDTO(ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseDTO> handleValidation(Exception ex) {
        return ResponseEntity.badRequest().body(new ResponseDTO("Проверьте заполнение полей"));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ResponseDTO> handleStatus(org.springframework.web.server.ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(new ResponseDTO(ex.getReason()));
    }

    @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class,
            org.springframework.web.bind.MissingServletRequestParameterException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ResponseDTO> handleMalformedRequest(Exception ex) {
        return ResponseEntity.badRequest().body(new ResponseDTO("Некорректный запрос"));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ResponseDTO> handleOversizedUpload(Exception ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(new ResponseDTO("Файл слишком большой"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDTO> handleException(Exception ex) {
        logger.error("Exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ResponseDTO("Внутренняя ошибка сервера. Попробуйте ещё раз."));
    }
}
