package ru.project.gameAssistantBackend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.project.gameAssistantBackend.dto.game.GameRequestDTO;
import ru.project.gameAssistantBackend.exception.customEx.notFound.CategoryNotFoundException;
import ru.project.gameAssistantBackend.exception.customEx.notFound.GameNotFoundException;
import ru.project.gameAssistantBackend.models.Category;
import ru.project.gameAssistantBackend.models.Game;
import ru.project.gameAssistantBackend.models.User;
import ru.project.gameAssistantBackend.repository.GameRepository;
import ru.project.gameAssistantBackend.service.GameServiceI;
import ru.project.gameAssistantBackend.specification.GameSpecification;

import java.util.List;
import java.util.Set;

@Service
public class GameServiceImpl implements GameServiceI {

    private final GameRepository gameRepository;

    private final FileServiceImpl fileServiceImpl;

    private final Converter converter;

    private final CategoryService categoryService;

    private final GameSpecification gameSpecification;

    @Autowired
    public GameServiceImpl(
            GameRepository gameRepository,
            FileServiceImpl fileServiceImpl,
            Converter converter,
            CategoryService categoryService,
            GameSpecification gameSpecification) {
        this.gameRepository = gameRepository;
        this.fileServiceImpl = fileServiceImpl;
        this.converter = converter;
        this.categoryService = categoryService;
        this.gameSpecification = gameSpecification;
    }

    public Page<Game> getPagedGames(
            int page, int size, String filter, String category, String sortBy, Sort.Direction direction) {
        Set<String> allowed = Set.of("id", "title");
        if (!allowed.contains(sortBy)) sortBy = "title";

        Sort sort = Sort.by(direction, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<Game> spec = gameSpecification.titleOrDescriptionContains(filter)
                .and(gameSpecification.hasCategory(category));

        return gameRepository.findAll(spec, pageable);
    }

    public Page<Game> getPagedFavouriteGames(
            User user, int page, int size, String filter, String category, String sortBy, Sort.Direction direction) {
        Set<String> allowed = Set.of("id", "title");
        if (!allowed.contains(sortBy)) {
            sortBy = "title";
        }

        Sort sort = Sort.by(direction, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Game> spec = gameSpecification.titleOrDescriptionContains(filter)
                .and(gameSpecification.hasCategory(category))
                .and(gameSpecification.isFavouriteOf(user));

        return gameRepository.findAll(spec, pageable);
    }


    public List<Game> getAllGames(){
        return gameRepository.findAll();
    }

    @Override
    public Game getGameById(Long id) throws GameNotFoundException {
        return gameRepository.findById(id)
                .orElseThrow(() -> new GameNotFoundException("Игра с таким id не найдена"));
    }

    @Transactional
    @Override
    public Game create(GameRequestDTO gameRequestDTO) throws CategoryNotFoundException {
        Game game = new Game();
        game.setTitle(gameRequestDTO.title());
        game.setDescription(gameRequestDTO.description());

        List<String> categoryNames = gameRequestDTO.categories();
        Set<Category> categories = categoryService.getCategories(categoryNames);
        game.setCategories(categories);

        MultipartFile imageFile = gameRequestDTO.imageFile();
        String imageFileTitle = fileServiceImpl.save(imageFile);
        game.setImageFileTitle(imageFileTitle);

        MultipartFile rulesFile = gameRequestDTO.rulesFile();
        String rulesFileTitle = fileServiceImpl.save(rulesFile);
        game.setRulesFileTitle(rulesFileTitle);
        try {
            converter.pdfToMd(rulesFileTitle);
        } catch (IllegalArgumentException e) {
            fileServiceImpl.delete(rulesFileTitle);
            fileServiceImpl.delete(imageFileTitle);
            throw e;
        }
        return gameRepository.save(game);
    }

    @Transactional
    @Override
    public Game update(Long id, GameRequestDTO gameRequestDTO)
            throws GameNotFoundException, CategoryNotFoundException {
        Game game = getGameById(id);
        if(gameRequestDTO.title() != null) {
            game.setTitle(gameRequestDTO.title());
        }

        if(gameRequestDTO.description() != null) {
            game.setDescription(gameRequestDTO.description());
        }

        List<String> categoryNames = gameRequestDTO.categories();
        if(categoryNames != null && !categoryNames.isEmpty()){
            Set<Category> categories = categoryService.getCategories(categoryNames);
            game.setCategories(categories);
        }

        MultipartFile newImageFile = gameRequestDTO.imageFile();
        if(newImageFile != null && !newImageFile.isEmpty()){
            String oldImageFileTitle = game.getImageFileTitle();
            fileServiceImpl.delete(oldImageFileTitle);
            String newImageFileTitle = fileServiceImpl.save(newImageFile);
            game.setImageFileTitle(newImageFileTitle);
        }

        MultipartFile newRulesFile = gameRequestDTO.rulesFile();
        if(newRulesFile != null && !newRulesFile.isEmpty()){
            String oldRulesFileTitle = game.getRulesFileTitle();
            String newRulesFileTitle = fileServiceImpl.save(newRulesFile);
            try {
                converter.pdfToMd(newRulesFileTitle);
            } catch (IllegalArgumentException e) {
                fileServiceImpl.delete(newRulesFileTitle);
                throw e;
            }
            fileServiceImpl.delete(oldRulesFileTitle);
            if (oldRulesFileTitle != null) {
                fileServiceImpl.delete(oldRulesFileTitle.replaceFirst("(?i)\\.pdf$", ".md"));
            }
            game.setRulesFileTitle(newRulesFileTitle);
        }

        return gameRepository.save(game);
    }

    @Transactional
    @Override
    public void delete(Long id) throws GameNotFoundException {
        Game game = getGameById(id);
        String imageFileTitle = game.getImageFileTitle();
        String rulesFileTitle = game.getRulesFileTitle();
        fileServiceImpl.delete(imageFileTitle);
        fileServiceImpl.delete(rulesFileTitle);
        if (rulesFileTitle != null) {
            fileServiceImpl.delete(rulesFileTitle.replaceFirst("(?i)\\.pdf$", ".md"));
        }
        gameRepository.delete(game);
    }

    public long getCountByCategory(Category category){
        return gameRepository.countByCategories_Name(category.getName());
    }
}
