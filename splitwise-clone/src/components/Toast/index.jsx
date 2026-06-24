import { useEffect } from "react";
import { createPortal } from "react-dom";
import useUIStore from "../../store/ui.store";
import styles from "./Toast.module.scss";

const AUTO_DISMISS_MS = 4000;

function ToastItem({ toast }) {
  const dismissToast = useUIStore((s) => s.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismissToast]);

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role="alert">
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={() => dismissToast(toast.id)}
        aria-label="Cerrar notificación"
      >
        &times;
      </button>
    </div>
  );
}

export default function Toast() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className={styles.container} aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>,
    document.body,
  );
}
