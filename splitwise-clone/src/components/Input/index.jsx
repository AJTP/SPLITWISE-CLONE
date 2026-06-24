import { useState } from "react";
import styles from "./Input.module.scss";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  helper,
  disabled = false,
  id,
  name,
  autoComplete,
  min,
  max,
  step,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;
  const inputId = id ?? name;

  const inputClasses = [
    styles.input,
    error ? styles.hasError : "",
    isPassword ? styles.hasToggle : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles.wrapper}>
        <input
          id={inputId}
          name={name}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={inputClasses}
          min={min}
          max={max}
          step={step}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? "Ocultar" : "Ver"}
          </button>
        )}
      </div>
      {error && (
        <span id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
      {!error && helper && <span className={styles.helper}>{helper}</span>}
    </div>
  );
}
