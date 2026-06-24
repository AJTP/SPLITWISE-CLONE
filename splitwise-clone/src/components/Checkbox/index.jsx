import styles from "./Checkbox.module.scss";

export default function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  id,
}) {
  return (
    <label className={`${styles.label} ${disabled ? styles.disabled : ""}`}>
      <input
        id={id}
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      {label}
    </label>
  );
}
