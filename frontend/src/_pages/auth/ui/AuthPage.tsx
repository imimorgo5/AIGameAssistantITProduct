import { authStyles as style0, LoginForm, RegisterForm } from "features/auth";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "shared/assets/LOGO.svg";
import { usePageTitle } from "shared/lib/page-title";
import { bindClasses } from "shared/lib/styles";
import { ToggleSlider } from "shared/ui/toggle-slider";
export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [afterRegister, setAfterRegister] = useState(false);
  const mode = location.pathname === "/register" ? "register" : "login";
  useEffect(() => {
    if (!afterRegister) return;

    const timer = setTimeout(() => {
      navigate("/login");
      setAfterRegister(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [afterRegister, navigate]);
  const switchMode = (login: boolean) =>
    navigate(login ? "/login" : "/register");

  const handleRegister = () => setAfterRegister(true);
  usePageTitle(mode === "login" ? "Вход" : "Регистрация");

  return (
    <div className={cx("auth-root")}>
      <div className={cx("auth-bg")} role="presentation" aria-hidden="true" />
      <div className={cx("auth-top")}>
        <Link to="/" className={cx("auth-logo-link")} aria-label="На главную">
          <div className={cx("auth-logo")}>
            <img src={logo} alt="AIGameAssistant" />
          </div>
        </Link>
      </div>

      <div className={cx("auth-container")}>
        <div className={cx("auth-left-container")} />
        <div className={cx("auth-right-container")}>
          <h1 className={cx("auth-hello")}>Добро пожаловать!</h1>
          <div
            className={cx("auth-card")}
            role="region"
            aria-label="Авторизация"
          >
            {!afterRegister && (
              <ToggleSlider
                leftLabel="Вход"
                rightLabel="Регистрация"
                value={mode === "login"}
                onChange={(s) => switchMode(s)}
              />
            )}
            <div
              className={cx(
                `auth-form-wrap ${afterRegister ? "after-register" : ""}`,
              )}
            >
              {!afterRegister ? (
                mode === "login" ? (
                  <LoginForm onSuccess={() => navigate("/")} />
                ) : (
                  <RegisterForm onSuccess={handleRegister} />
                )
              ) : (
                <div className={cx("auth-success-message")}>
                  Для завершения регистрации необходимо перейти по ссылке из
                  письма, которое было отправлено на указанный email.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const cx = bindClasses(style0);
