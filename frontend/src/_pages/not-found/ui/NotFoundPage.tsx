import { useAuth } from "entities/session";
import { Link } from "react-router-dom";
import logo from "shared/assets/LOGO.svg";
import { usePageTitle } from "shared/lib/page-title";

import styles from "./NotFoundPage.module.scss";

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  usePageTitle("Страница не найдена");

  return (
    <main className={styles.root}>
      <Link to="/" className={styles.logo} aria-label="AIGameAssistant — на главную">
        <img src={logo} alt="AIGameAssistant" width={112} height={42} />
      </Link>
      <section className={styles.card} aria-labelledby="not-found-title">
        <div className={styles.code} aria-hidden="true">
          <span>4</span>
          <svg className={styles.die} viewBox="0 0 100 100" fill="none">
            <rect x="8" y="8" width="84" height="84" rx="24" stroke="currentColor" strokeWidth="5" />
            <circle cx="31" cy="31" r="6" fill="currentColor" />
            <circle cx="69" cy="31" r="6" fill="currentColor" />
            <circle cx="50" cy="50" r="6" fill="currentColor" />
            <circle cx="31" cy="69" r="6" fill="currentColor" />
            <circle cx="69" cy="69" r="6" fill="currentColor" />
          </svg>
          <span>4</span>
        </div>
        <h1 id="not-found-title" className={styles.title}>Кажется, вы вышли за поле</h1>
        <p className={styles.description}>Такой страницы нет. Возможно, ссылка устарела или в адресе есть опечатка. </p>
        <Link to={isAuthenticated ? "/" : "/login"} className={`btn ${styles.action}`}>
          {isAuthenticated ? "Перейти к играм" : "Перейти ко входу"}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
