import { useState } from "react";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../hooks/useAuth";
import useUIStore from "../../store/ui.store";
import {
  isValidEmail,
  isMinLength,
  passwordsMatch,
  firstError,
} from "../../utils/validation";

export default function RegisterModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const showToast = useUIStore((s) => s.showToast);

  const validate = () => {
    const newErrors = {};

    const nameErr = firstError([
      { check: isMinLength(name, 1), message: "El nombre es obligatorio" },
    ]);
    if (nameErr) newErrors.name = nameErr;

    const emailErr = firstError([
      { check: isMinLength(email, 1), message: "El correo es obligatorio" },
      { check: isValidEmail(email), message: "El correo no es válido" },
    ]);
    if (emailErr) newErrors.email = emailErr;

    const passwordErr = firstError([
      {
        check: isMinLength(password, 8),
        message: "La contraseña debe tener al menos 8 caracteres",
      },
    ]);
    if (passwordErr) newErrors.password = passwordErr;

    const confirmErr = firstError([
      {
        check: isMinLength(confirmPassword, 1),
        message: "Confirma la contraseña",
      },
      {
        check: passwordsMatch(password, confirmPassword),
        message: "Las contraseñas no coinciden",
      },
    ]);
    if (confirmErr) newErrors.confirmPassword = confirmErr;

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({ name, email, password });
      setSuccess(true);
    } catch (err) {
      const message =
        err.response?.data?.message ??
        "Error al registrar. Inténtalo de nuevo.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear cuenta"
      footer={
        !success && (
          <Button
            type="submit"
            form="register-form"
            fullWidth
            loading={loading}
          >
            Registrarme
          </Button>
        )
      }
    >
      {success ? (
        <p>Revisa tu bandeja de correo electrónico para confirmar tu cuenta.</p>
      ) : (
        <form id="register-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Nombre"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoComplete="name"
          />
          <Input
            label="Correo electrónico"
            type="email"
            id="reg-email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            type="password"
            id="reg-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            helper="Mínimo 8 caracteres"
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            id="confirm-password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
        </form>
      )}
    </Modal>
  );
}
