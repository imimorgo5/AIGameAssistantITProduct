import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useBlurField } from "shared/lib/forms";
import { bindClasses } from "shared/lib/styles";

import styles from "./FileViewer.module.scss";

interface Props {
  fileUrl: string;
  width: number;
  onError: () => void;
}

const assetBase = `${process.env.PUBLIC_URL}/pdfjs`;
const options = {
  cMapUrl: `${assetBase}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${assetBase}/standard_fonts/`,
  wasmUrl: `${assetBase}/wasm/`,
};

pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs?v=${pdfjs.version}`;

interface PageSlotProps {
  number: number;
  width: number;
  zoom: number;
  active: number;
  viewport: HTMLDivElement | null;
  onError: () => void;
}

function PageSlot({ number, width, zoom, active, viewport, onError }: PageSlotProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(number <= 2);
  const [ratio, setRatio] = useState(Math.SQRT2);
  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || !viewport || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setNearby(entry.isIntersecting);
    }, { root: viewport, rootMargin: "100% 0px" });

    observer.observe(slot);

    return () => observer.disconnect();
  }, [viewport]);

  return (
    <div ref={slotRef} role="group" aria-label={`Страница ${number}`} className={cx("pdf-page-slot")} data-pdf-page={number} style={{ width: width * zoom, minHeight: width * zoom * ratio }}>
      {nearby || Math.abs(number - active) <= 1 ? (
        <Page pageNumber={number} width={width} scale={zoom} devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)} onLoadSuccess={({ originalWidth, originalHeight }) => setRatio(originalHeight / originalWidth)} onLoadError={onError} onRenderError={onError} error="" loading={<div className={cx("fv-center")} role="status">Загрузка страницы {number}…</div>} renderAnnotationLayer renderTextLayer />
      ) : <span className={cx("sr-only")}>Страница {number}</span>}
    </div>
  );
}

export default function PdfViewer({ fileUrl, width, onError }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const validatePage = (value: string) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= numPages ? "" : `Укажите страницу от 1 до ${numPages || 1}`;
  const pageField = useBlurField(pageInput, validatePage);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollFrame = useRef<number | null>(null);
  useEffect(() => () => {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
  }, []);
  const handleScroll = () => {
    if (scrollFrame.current !== null) return;

    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
      const viewport = viewportRef.current;
      if (!viewport) return;

      const top = viewport.getBoundingClientRect().top + 24;
      let current = 1;
      for (const slot of Array.from(viewport.querySelectorAll<HTMLElement>("[data-pdf-page]"))) {
        if (slot.getBoundingClientRect().top > top) break;

        current = Number(slot.dataset.pdfPage);
      }

      setPageNumber(current);
      if (document.activeElement !== inputRef.current) setPageInput(String(current));
    });
  };

  const goToPage = (value: number) => {
    const next = Math.min(numPages, Math.max(1, value));
    if (!Number.isInteger(next) || numPages < 1) return;

    pageField.reset();
    setPageNumber(next);
    setPageInput(String(next));
    if (viewportRef.current) {
      const viewport = viewportRef.current;
      const slot = viewport.querySelector<HTMLElement>(`[data-pdf-page="${next}"]`);
      if (slot) viewport.scrollTop += slot.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 12;
    }
  };

  const commitPage = () => {
    pageField.onBlur();
    if (!validatePage(pageInput)) goToPage(Number(pageInput));
  };

  return (
    <div className={cx("pdf-reader")}>
      <div className={cx("pdf-controls")} role="group" aria-label="Управление PDF">
        <form
          className={cx("pdf-pagination")}
          onSubmit={(event) => {
            event.preventDefault();
            commitPage();
          }}
        >
          <button type="button" className={cx("pdf-button")} aria-label="Предыдущая страница" disabled={pageNumber <= 1 || !numPages} onClick={() => goToPage(pageNumber - 1)}>←</button>
          <div className={cx("pdf-page-field")}>
            <input ref={inputRef} className={cx("pdf-page-input")} aria-label="Номер страницы" type="text" inputMode="numeric" role="spinbutton" aria-valuemin={1} aria-valuemax={numPages || 1} aria-valuenow={pageNumber} maxLength={String(numPages || 1).length} value={pageInput} disabled={!numPages} onChange={(event) => setPageInput(event.target.value)} onBlur={commitPage} aria-invalid={!!pageField.error} aria-describedby={pageField.error ? "pdf-page-error" : undefined} />
            {pageField.error && <span id="pdf-page-error" className={cx("pdf-field-error")} role="alert">{pageField.error}</span>}
          </div>
          <span className={cx("pdf-page-count")}>из {numPages || "…"}</span>
          <button type="button" className={cx("pdf-button")} aria-label="Следующая страница" disabled={!numPages || pageNumber >= numPages} onClick={() => goToPage(pageNumber + 1)}>→</button>
        </form>
        <div className={cx("pdf-zoom")}>
          <button type="button" className={cx("pdf-button")} aria-label="Уменьшить масштаб" disabled={!numPages || zoom <= 0.5} onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}>−</button>
          <output className={cx("pdf-zoom-value")} aria-label="Масштаб">{Math.round(zoom * 100)}%</output>
          <button type="button" className={cx("pdf-button")} aria-label="Увеличить масштаб" disabled={!numPages || zoom >= 2} onClick={() => setZoom((value) => Math.min(2, value + 0.25))}>+</button>
          <button type="button" className={cx("pdf-button")} disabled={!numPages || zoom === 1} onClick={() => setZoom(1)}>По ширине</button>
        </div>
      </div>
      <span className={cx("sr-only")} role="status">{numPages ? `Страница ${pageNumber} из ${numPages}` : "Загрузка PDF"}</span>
      <div ref={viewportRef} onScroll={handleScroll} className={cx("pdf-viewport")} role="region" aria-label="Документ PDF" tabIndex={0}>
        <Document
          file={fileUrl}
          options={options}
          onLoadSuccess={({ numPages: total }) => {
            if (total < 1) {
              onError();

              return;
            }

            setNumPages(total);
          }}
          onLoadError={onError}
          onSourceError={onError}
          onPassword={onError}
          onItemClick={({ pageNumber: target }) => {
            if (target) goToPage(target);
          }}
          externalLinkTarget="_blank"
          externalLinkRel="noopener noreferrer"
          error=""
          loading={<div className={cx("fv-center")} role="status">Загрузка документа…</div>}
        >
          {Array.from({ length: numPages }, (_, index) => (
            <PageSlot key={index + 1} number={index + 1} width={Math.max(1, width - 24)} zoom={zoom} active={pageNumber} viewport={viewportRef.current} onError={onError} />
          ))}
        </Document>
      </div>
    </div>
  );
}
const cx = bindClasses(styles);
