package ru.project.gameAssistantBackend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.project.gameAssistantBackend.service.impl.FileServiceImpl;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileServiceImpl fileServiceImpl;

    @Autowired
    public FileController(FileServiceImpl fileServiceImpl) {
        this.fileServiceImpl = fileServiceImpl;
    }

    @GetMapping("/image/{imageFileTitle}")
    public ResponseEntity<Resource> getImageFile(@PathVariable("imageFileTitle") String imageFileTitle)
            throws Exception {
        Resource resource = fileServiceImpl.getFileResource(imageFileTitle);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
    }

    @GetMapping("/rules/{rulesFileTitle}")
    public ResponseEntity<Resource> getRulesFile(@PathVariable("rulesFileTitle") String rulesFileTitle)
            throws Exception {
        Resource resource = fileServiceImpl.getFileResource(rulesFileTitle);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    @GetMapping("/rules/text/{rulesFileTitle}")
    public String getTextFromFile(@PathVariable("rulesFileTitle") String rulesFileTitle)  {
        return fileServiceImpl.extractTextFromMarkdown(rulesFileTitle);
    }
}
