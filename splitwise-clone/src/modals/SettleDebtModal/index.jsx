import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Button from "../../components/Button";
import useUIStore from "../../store/ui.store";
import { formatCurrency } from "../../utils/formatCurrency";

export default function SettleDebtModal({
  isOpen,
  onClose,
  debt,
  groupId,
  onSettle,
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    if (debt) {
      setAmount(String(debt.amount));
    }
  }, [debt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return;

    setLoading(true);
    try {
      await onSettle({
        payerId: debt.fromUserId,
        payeeId: debt.toUserId,
        amount: parsed,
      });
      showToast("Pago registrado", "success");
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Error al registrar el pago";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar pago"
      footer={
        <Button type="submit" form="settle-form" fullWidth loading={loading}>
          Confirmar pago
        </Button>
      }
    >
      {debt && (
        <form id="settle-form" onSubmit={handleSubmit} noValidate>
          <p>
            Pago de <strong>tú</strong> a <strong>{debt.toUserName}</strong>
          </p>
          <Input
            label="Importe (€)"
            type="number"
            id="settle-amount"
            name="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            helper={`Deuda original: ${formatCurrency(debt.amount)}`}
          />
        </form>
      )}
    </Modal>
  );
}
