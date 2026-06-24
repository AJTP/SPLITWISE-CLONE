import { useState } from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";
import RegisterModal from "../../modals/RegisterModal";
import ForgotPasswordModal from "../../modals/ForgotPasswordModal";
import { useAuth } from "../../hooks/useAuth";
import useUIStore from "../../store/ui.store";
import styles from "./LoginPage.module.scss";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const { login } = useAuth();
  const showToast = useUIStore((s) => s.showToast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
    } catch {
      showToast("Credenciales incorrectas", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.appName}>Splitwise</span>
          <p className={styles.subtitle}>Gestiona gastos compartidos</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="tu@correo.com"
          />
          <Input
            label="Contraseña"
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Button type="submit" fullWidth loading={loading}>
            Iniciar sesión
          </Button>
        </form>

        <div className={styles.links}>
          <button
            type="button"
            className={styles.link}
            onClick={() => setIsRegisterOpen(true)}
          >
            Registrarme
          </button>
          <button
            type="button"
            className={styles.link}
            onClick={() => setIsForgotOpen(true)}
          >
            Olvidé mi contraseña
          </button>
        </div>
      </div>

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
    </div>
  );
}
