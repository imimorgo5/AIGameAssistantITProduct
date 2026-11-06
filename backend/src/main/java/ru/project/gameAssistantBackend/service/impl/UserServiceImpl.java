package ru.project.gameAssistantBackend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.project.gameAssistantBackend.dto.user.UserRequestDTO;
import ru.project.gameAssistantBackend.exception.customEx.notFound.UserNotFoundException;
import ru.project.gameAssistantBackend.models.*;
import ru.project.gameAssistantBackend.repository.UserRepository;
import ru.project.gameAssistantBackend.service.UserServiceI;
import ru.project.gameAssistantBackend.specification.UserSpecification;

import java.util.List;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserServiceI {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final FileServiceImpl fileServiceImpl;
    private final UserSpecification userSpecification;
    private final ru.project.gameAssistantBackend.ai.ModelCatalog catalog;

    @Autowired
    public UserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            FileServiceImpl fileServiceImpl,
            UserSpecification userSpecification,
            ru.project.gameAssistantBackend.ai.ModelCatalog catalog) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileServiceImpl = fileServiceImpl;
        this.userSpecification = userSpecification;
        this.catalog = catalog;
    }

    @Override
    public List<User> getAllUsers(){
        return userRepository.findAll();
    }

    public Page<User> getPagedUsers(int page, int size, String filter) {
        Sort sort = Sort.by(
                Sort.Order.by("role").with(Sort.Direction.DESC),
                Sort.Order.by("id").with(Sort.Direction.ASC));

        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<User> spec = userSpecification.loginOrEmailContains(filter);
        return userRepository.findAll(spec, pageable);
    }

    @Override
    public User getById(Long id) throws UserNotFoundException {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Пользователь с таким id не найден"));
    }

    @Override
    public User getByEmail(String email) throws UserNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Пользователь не найден"));
    }

    public User getUserByPasswordResetToken(String token) {
        return userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }

    @Transactional
    public User create(UserRequestDTO userRequestDTO){
        User user = new User();
        user.setEmail(userRequestDTO.email());
        user.setLogin(userRequestDTO.login());
        user.setPassword(passwordEncoder.encode(userRequestDTO.password()));
        user.setRole(Role.USER);
        user.setEnabled(false);

        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);
        return userRepository.save(user);
    }

    @Transactional
    @Override
    public void updatePassword(User user, String password) {
        String newEncodedPassword = passwordEncoder.encode(password);
        user.setPassword(newEncodedPassword);
        userRepository.save(user);
    }

    @Transactional
    public void updateModel(User user, String model) {
        catalog.requireEnabled(model);
        user.setModel(model);
        userRepository.save(user);
    }

    @Transactional
    @Override
    public User updateImage(User user, MultipartFile imageFile) {
        String oldUserImageTitle = user.getImageFileTitle();
        fileServiceImpl.delete(oldUserImageTitle);

        String newUserImageTitle = fileServiceImpl.save(imageFile);
        user.setImageFileTitle(newUserImageTitle);
        userRepository.save(user);

        return user;
    }

    @Transactional
    @Override
    public void updateRole(Long id) throws UserNotFoundException {
        User user = getById(id);
        if(user.getRole().equals(Role.ADMIN)){
            user.setRole(Role.USER);
        } else {
            user.setRole(Role.ADMIN);
        }
        userRepository.save(user);
    }

    public void enableUser(User user){
        user.setEnabled(true);
        userRepository.save(user);
    }

    public void setNullPasswordResetToken(User user){
        user.setPasswordResetToken(null);
        userRepository.save(user);
    }

    public String setPasswordResetToken(User user) {
        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        userRepository.save(user);
        return token;
    }

    @Transactional
    @Override
    public void deleteUser(Long userId) throws UserNotFoundException {
        User user = getById(userId);
        userRepository.delete(user);
    }
}
