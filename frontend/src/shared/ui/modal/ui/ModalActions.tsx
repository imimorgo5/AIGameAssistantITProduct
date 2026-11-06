import styles from "./Modal.module.scss";

import type { ReactNode } from "react";

export default function ModalActions({ children }: { children: ReactNode }) {
  return <div className={styles["modal-actions"]}>{children}</div>;
}
