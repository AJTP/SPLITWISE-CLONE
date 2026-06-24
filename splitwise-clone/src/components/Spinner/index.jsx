import styles from "./Spinner.module.scss";

export default function Spinner({ size = "md" }) {
  return (
    <span
      className={`${styles.spinner} ${styles[size]}`}
      role="status"
      aria-label="Cargando"
    />
  );
}
