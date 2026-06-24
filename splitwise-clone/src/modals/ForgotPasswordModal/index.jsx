import { useState } from "react";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useAuth } from "../../hooks/useAuth";
import useUIStore from "../../store/ui.store";
import { isValidEmail, firstError } from "../../utils/validation";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { forgotPassword } = useAuth();
  const showToast = useUIStore((s) => s.showToast);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = firstError([
      { check: email.trim().length > 0, message: "El correo es obligatorio" },
      { check: isValidEmail(email), message: "El correo no es válido" },
    ]);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Error al enviar el correo.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Recuperar contraseña"
      footer={
        !success && (
          <Button type="submit" form="forgot-form" fullWidth loading={loading}>
            Enviar correo
          </Button>
        )
      }
    >
      {success ? (
        <p>Revisa tu bandeja de correo para recuperar tu contraseña.</p>
      ) : (
        <form id="forgot-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            id="forgot-email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            autoComplete="email"
            placeholder="tu@correo.com"
          />
        </form>
      )}
    </Modal>
  );
}
