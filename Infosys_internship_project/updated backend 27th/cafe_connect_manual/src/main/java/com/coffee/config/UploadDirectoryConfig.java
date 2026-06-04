package com.coffee.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class UploadDirectoryConfig {

    @PostConstruct
    public void ensureUploadDirectoriesExist() {
        createIfMissing(Paths.get(System.getProperty("user.dir"), "uploads"));
        createIfMissing(Paths.get(System.getProperty("java.io.tmpdir"), "cafe-connect-manual"));
    }

    private void createIfMissing(Path path) {
        File dir = path.toFile();
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }
}
