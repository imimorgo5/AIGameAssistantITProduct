import { Component } from "react";

import styles from "./ErrorBoundary.module.scss";

import type { ErrorInfo, ReactNode } from "react";
export class ErrorBoundary extends Component<
  {
    children: ReactNode;
  },
  {
    failed: boolean;
  }
> {
  override state = {
    failed: false,
  };

  static getDerivedStateFromError() {
    return {
      failed: true,
    };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo) {
    document.title = "AIGameAssistant - Ошибка приложения";
  }

  override render() {
    if (this.state.failed)
      return (
        <main className={styles.root} role="alert">
          <h1>Не удалось отобразить страницу</h1>
          <p>Обновите страницу, чтобы попробовать ещё раз.</p>
          <button
            type="button"
            className="btn"
            onClick={() => window.location.reload()}
          >
            Обновить
          </button>
        </main>
      );

    return this.props.children;
  }
}
