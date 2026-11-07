"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authStyles as style0, LoginForm, RegisterForm } from "features/auth";
import { bindClasses } from "shared/lib/styles";
import { ToggleSlider } from "shared/ui/toggle-slider";

const logo = "/images/LOGO.svg";
export default function AuthPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [afterRegister, setAfterRegister] = useState(false);
  const mode = pathname === "/register" ? "register" : "login";
  useEffect(() => {
    if (!afterRegister) return;

    const timer = setTimeout(() => {
      router.push("/login");
      setAfterRegister(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [afterRegister, router]);
  const switchMode = (login: boolean) =>
    router.push(login ? "/login" : "/register");

  const handleRegister = () => setAfterRegister(true);

  return (
    <div className={cx("auth-root")}>
      <div className={cx("auth-bg")} role="presentation" aria-hidden="true" />
      <div className={cx("auth-top")}>
        <Link href="/" className={cx("auth-logo-link")} aria-label="На главную">
          <div className={cx("auth-logo")}>
            <Image
              unoptimized
              width={112}
              height={42}
              src={logo}
              alt="AIGameAssistant"
            />
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
                  <LoginForm onSuccess={() => router.push("/")} />
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
