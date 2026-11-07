"use client";

import Image from "next/image";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { fileApi } from "shared/api/file";
import { downloadBlob } from "shared/lib/blobUtils";
import { bindClasses } from "shared/lib/styles";
import { useBlobUrl } from "shared/lib/useBlobUrl";
import { originalFileName } from "shared/lib/utils";

import styles from "./FileViewer.module.scss";
import PdfErrorBoundary from "./PdfErrorBoundary";

import type { ReactNode } from "react";

interface Props {
  fileType: "pdf" | "image";
  fileTitle: string;
  title?: string;
  onClose?: () => void;
  closeIcon?: ReactNode;
  closeButtonClassName?: string;
  appearance?: "default" | "sidebar";
}

export default function FileViewer(props: Props) {
  return (
    <FileViewerContent
      key={`${props.fileType}:${props.fileTitle}`}
      {...props}
    />
  );
}

function FileViewerContent({
  fileType,
  fileTitle,
  title,
  onClose,
  closeIcon,
  closeButtonClassName,
  appearance = "default",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderWidth, setRenderWidth] = useState(600);
  const [pdfFailed, setPdfFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [PdfViewer, setPdfViewer] = useState(() =>
    lazy(() => import("./PdfViewer")),
  );
  const {
    url: fileUrl,
    loading,
    error,
    refresh,
  } = useBlobUrl(
    fileType === "pdf" ? fileApi.getRulesBlob : fileApi.getImageBlob,
    fileTitle,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () =>
      setRenderWidth(Math.max(1, Math.floor(container.clientWidth)));
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);

      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const fallback = (
    <div className={cx("fv-message")}>
      <p role="alert">
        Не удалось показать PDF внутри приложения. Откройте файл в браузере или
        скачайте его.
      </p>
      <button
        type="button"
        className={cx("pdf-button")}
        onClick={() => {
          setPdfFailed(false);
          setAttempt((value) => value + 1);
          setPdfViewer(() => lazy(() => import("./PdfViewer")));
        }}
      >
        Повторить просмотр
      </button>
    </div>
  );

  return (
    <div className={cx("file-viewer-root")} data-appearance={appearance}>
      <div className={cx("file-viewer-header")}>
        <div className={cx("file-viewer-leading")}>
          {onClose && (
            <button
              type="button"
              className={
                closeButtonClassName ?? cx("pdf-button file-viewer-close")
              }
              onClick={onClose}
              aria-label="Закрыть просмотрщик"
              title="Закрыть просмотрщик"
            >
              {closeIcon ?? "×"}
            </button>
          )}
        </div>
        <h2 className={cx("file-viewer-title")} title={title || fileTitle}>
          {title || originalFileName(fileTitle) || "Правила игры"}
        </h2>
        <div className={cx("file-viewer-actions")}>
          {fileType === "pdf" && fileUrl && !loading && (
            <a
              className={cx("file-viewer-action")}
              aria-label="Открыть PDF"
              title="Открыть PDF"
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 3h7v7M21 3 10 14" />
                <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
              </svg>
            </a>
          )}
          <button
            type="button"
            className={cx("file-viewer-action")}
            aria-label="Скачать"
            title="Скачать"
            onClick={() => downloadBlob(fileUrl, true, fileTitle)}
            disabled={!fileUrl || loading}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
            </svg>
          </button>
        </div>
      </div>
      <div className={cx("file-viewer-body")} ref={containerRef}>
        {!fileTitle && (
          <div className={cx("fv-message")}>Файл пока не добавлен.</div>
        )}
        {loading && (
          <div className={cx("fv-center")} role="status">
            Загрузка файла…
          </div>
        )}
        {error && (
          <div className={cx("fv-message")}>
            <p className={cx("fv-error")} role="alert">
              {error}
            </p>
            <button
              type="button"
              className={cx("pdf-button")}
              onClick={refresh}
            >
              Повторить загрузку
            </button>
          </div>
        )}
        {!loading && !error && fileType === "image" && fileUrl && (
          <div className={cx("fv-image-wrap")}>
            <Image
              unoptimized
              width={512}
              height={512}
              className={cx("fv-image")}
              src={fileUrl}
              alt={fileTitle}
            />
          </div>
        )}
        {!loading && !error && fileType === "pdf" && fileUrl && (
          <PdfErrorBoundary key={`${fileUrl}:${attempt}`} fallback={fallback}>
            {pdfFailed ? (
              fallback
            ) : (
              <Suspense
                fallback={
                  <div className={cx("fv-center")} role="status">
                    Загрузка просмотрщика…
                  </div>
                }
              >
                <PdfViewer
                  key={fileUrl}
                  fileUrl={fileUrl}
                  width={renderWidth}
                  onError={() => setPdfFailed(true)}
                />
              </Suspense>
            )}
          </PdfErrorBoundary>
        )}
      </div>
    </div>
  );
}

const cx = bindClasses(styles);
