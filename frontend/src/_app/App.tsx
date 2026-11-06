import { AuthProvider, PrivateRoute } from "entities/session";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "shared/lib/theme";

import { ErrorBoundary } from "./ui/ErrorBoundary";
const MainPage = lazy(() =>
  import("_pages/main").then((module) => ({
    default: module.MainPage,
  })),
);

const AuthPage = lazy(() =>
  import("_pages/auth").then((module) => ({
    default: module.AuthPage,
  })),
);

const ProfilePage = lazy(() =>
  import("_pages/profile").then((module) => ({
    default: module.ProfilePage,
  })),
);

const AdminPage = lazy(() =>
  import("_pages/admin").then((module) => ({
    default: module.AdminPage,
  })),
);

const ChatPage = lazy(() =>
  import("_pages/chat").then((module) => ({
    default: module.ChatPage,
  })),
);

const ResetPasswordPage = lazy(() =>
  import("_pages/reset-password").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);

const VerifyEmailPage = lazy(() =>
  import("_pages/verify-email").then((module) => ({
    default: module.VerifyEmailPage,
  })),
);

const NotFoundPage = lazy(() =>
  import("_pages/not-found").then((module) => ({
    default: module.NotFoundPage,
  })),
);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense
              fallback={
                <div
                  className="full-loader"
                  role="status"
                  aria-label="Загрузка страницы"
                >
                  <div className="spinner" />
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <AdminPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/games/ai/:gameId?/:chatId?"
                  element={
                    <PrivateRoute>
                      <ChatPage />
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
