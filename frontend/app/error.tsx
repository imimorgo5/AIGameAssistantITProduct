"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main role="alert">
      <h1>Не удалось отобразить страницу</h1>
      <p>Попробуйте загрузить страницу ещё раз.</p>
      <button type="button" className="btn" onClick={reset}>
        Повторить
      </button>
    </main>
  );
}
