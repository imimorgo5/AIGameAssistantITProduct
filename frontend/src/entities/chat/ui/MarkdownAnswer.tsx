import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { bindClasses } from "shared/lib/styles";

import styles from "./ChatMessage.module.scss";

import type { Components } from "react-markdown";

const cx = bindClasses(styles);
const plugins = [remarkGfm];
const components: Components = {
  a: ({ href, children, title }) =>
    href ? (
      <a href={href} title={title} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  table: ({ children }) => (
    <div
      className={cx("markdown-table")}
      role="region"
      aria-label="Таблица в ответе"
      tabIndex={0}
    >
      <table>{children}</table>
    </div>
  ),
};

export default memo(function MarkdownAnswer({ text }: { text: string }) {
  return (
    <div className={cx("chat-message-text markdown")}>
      <Markdown
        skipHtml
        disallowedElements={["img"]}
        remarkPlugins={plugins}
        components={components}
      >
        {text}
      </Markdown>
    </div>
  );
});
