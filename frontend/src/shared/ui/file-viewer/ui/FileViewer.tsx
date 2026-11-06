import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { fileApi } from "shared/api/file";
import { downloadBlob } from "shared/lib/blobUtils";
import { bindClasses } from "shared/lib/styles";
import { useBlobUrl } from "shared/lib/useBlobUrl";

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
}

export default function FileViewer(props: Props) {
  return <FileViewerContent key={`${props.fileType}:${props.fileTitle}`} {...props} />;
}

function FileViewerContent({ fileType, fileTitle, title, onClose, closeIcon, closeButtonClassName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderWidth, setRenderWidth] = useState(600);
  const [pdfFailed, setPdfFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [PdfViewer, setPdfViewer] = useState(() => lazy(() => import("./PdfViewer")));
  const { url: fileUrl, loading, error, refresh } = useBlobUrl(
    fileType === "pdf" ? fileApi.getRulesBlob : fileApi.getImageBlob,
    fileTitle,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => setRenderWidth(Math.max(1, Math.floor(container.clientWidth)));
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
      <p role="alert">Не удалось показать PDF внутри приложения. Откройте файл в браузере или скачайте его.</p>
      <button
        type="button"
        className={cx("pdf-button")}
        onClick={() => {
          setPdfFailed(false);
          setAttempt((value) => value + 1);
          setPdfViewer(() => lazy(() => import("./PdfViewer")));
        }}
      >Повторить просмотр
      </button>
    </div>
  );

  return (
    <div className={cx("file-viewer-root")}>
      <div className={cx("file-viewer-header")}>
        <div className={cx("file-viewer-leading")}>
          {onClose && (
            <button type="button" className={closeButtonClassName ?? cx("pdf-button file-viewer-close")} onClick={onClose} aria-label="Закрыть просмотрщик" title="Закрыть просмотрщик">
              {closeIcon ?? "×"}
            </button>
          )}
        </div>
        <h2 className={cx("file-viewer-title")} title={title || fileTitle}>
          {title || fileTitle.replace(/^\d{13}[_-]?/, "") || "Правила игры"}
        </h2>
        <div className={cx("file-viewer-actions")}>
          {fileType === "pdf" && fileUrl && !loading && (
            <a
              className={cx("pdf-button")}
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Открыть PDF
            </a>
          )}
          <button
            type="button"
            className={cx("pdf-button")}
            onClick={() => downloadBlob(fileUrl, true, fileTitle)}
            disabled={!fileUrl || loading}
          >
            Скачать
          </button>
        </div>
      </div>
      <div className={cx("file-viewer-body")} ref={containerRef}>
        {!fileTitle && <div className={cx("fv-message")}>Файл пока не добавлен.</div>}
        {loading && (
          <div className={cx("fv-center")} role="status">Загрузка файла…</div>
        )}
        {error && (
          <div className={cx("fv-message")}>
            <p className={cx("fv-error")} role="alert">{error}</p>
            <button type="button" className={cx("pdf-button")} onClick={refresh}>
              Повторить загрузку
            </button>
          </div>
        )}
        {!loading && !error && fileType === "image" && fileUrl && (
          <div className={cx("fv-image-wrap")}>
            <img className={cx("fv-image")} src={fileUrl} alt={fileTitle} />
          </div>
        )}
        {!loading && !error && fileType === "pdf" && fileUrl && (
          <PdfErrorBoundary key={`${fileUrl}:${attempt}`} fallback={fallback}>
            {pdfFailed ? fallback : (
              <Suspense fallback={
                <div className={cx("fv-center")} role="status">Загрузка просмотрщика…</div>
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
