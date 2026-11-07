"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "entities/session";
import { authStyles as style0 } from "features/auth";
import { bindClasses } from "shared/lib/styles";

import style1 from "./VerifyEmailPages.module.scss";

const logo = "/images/LOGO.svg";
export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { confirmEmail } = useAuth();
  const token = searchParams.get("token");

  const verification = useRef<{ token: string; pending: Promise<void> } | null>(
    null,
  );
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    if (!token) {
      router.push("/login");

      return;
    }

    let active = true;
    const verify = async () => {
      try {
        if (verification.current?.token !== token)
          verification.current = { token, pending: confirmEmail(token) };
        await verification.current.pending;
        if (active) setStatus("success");
      } catch {
        if (active) setStatus("error");
      }
    };

    void verify();

    return () => {
      active = false;
    };
  }, [token, confirmEmail, router]);
  useEffect(() => {
    if (status === "loading") return;

    const timer = setTimeout(
      () => router.push(status === "success" ? "/" : "/login"),
      2000,
    );

    return () => clearTimeout(timer);
  }, [status, router]);

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
