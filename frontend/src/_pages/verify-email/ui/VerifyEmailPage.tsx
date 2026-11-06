import { useAuth } from "entities/session";
import { authStyles as style0 } from "features/auth";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "shared/assets/LOGO.svg";
import { usePageTitle } from "shared/lib/page-title";
import { bindClasses } from "shared/lib/styles";

import style1 from "./VerifyEmailPages.module.scss";
export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmEmail } = useAuth();
  const token = useMemo(() => {
    return new URLSearchParams(location.search).get("token");
  }, [location.search]);

  const [status, setStatus] = useState("loading");
  useEffect(() => {
    if (!token) {
      navigate("/login");

      return;
    }

    let active = true;
    const verify = async () => {
      try {
        await confirmEmail(token);
        if (active) setStatus("success");
      } catch {
        if (active) setStatus("error");
      }
    };

    void verify();

    return () => {
      active = false;
    };
  }, [token, confirmEmail, navigate]);
  useEffect(() => {
    if (status === "loading") return;

    const timer = setTimeout(
      () => navigate(status === "success" ? "/" : "/login"),
      2000,
    );

    return () => clearTimeout(timer);
  }, [status, navigate]);
  usePageTitle("Подтверждение почты");

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

      <div className={cx("verify-container")}>
        <h1 className={cx("verify-title")}>Подтверждение почты</h1>
        {status === "loading" && (
          <div className={cx("verify-message verify-loading-message")}>
            Идет подтверждение почты...
          </div>
        )}

        {status === "success" && (
          <div className={cx("verify-message verify-success-message")}>
            Почта успешно подтверждена!
          </div>
        )}

        {status === "error" && (
          <div className={cx("verify-message verify-error-message")}>
            Не удалось подтвердить почту
          </div>
        )}
      </div>
    </div>
  );
}
const cx = bindClasses(style0, style1);
