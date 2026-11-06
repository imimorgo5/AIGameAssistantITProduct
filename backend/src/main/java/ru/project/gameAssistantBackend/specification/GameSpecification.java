package ru.project.gameAssistantBackend.specification;

import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import ru.project.gameAssistantBackend.models.Game;
import ru.project.gameAssistantBackend.models.User;

@Component
public class GameSpecification {

    public Specification<Game> titleOrDescriptionContains(String filter) {
        return (root, query, cb) -> {
            if (filter == null || filter.isBlank()) return null;
            String pattern = "%" + filter.trim().toLowerCase() + "%";
            Expression<String> title = cb.lower(root.get("title"));
            Expression<String> desc = cb.lower(root.get("description"));
            return cb.or(cb.like(title, pattern), cb.like(desc, pattern));
        };
    }

    public Specification<Game> hasCategory(String categoryName) {
        return (root, query, cb) -> {
            if (categoryName == null || categoryName.isBlank()) return null;

            Join<Object, Object> categories = root.join("categories", JoinType.INNER);

            query.distinct(true);

            return cb.equal(
                    cb.lower(categories.get("name")),
                    categoryName.trim().toLowerCase()
            );
        };
    }

    public Specification<Game> isFavouriteOf(User user) {
        return (root, query, cb) -> {
            Join<Game, User> users = root.join("users"); // имя поля в Game
            return cb.equal(users.get("id"), user.getId());
        };
    }
}
