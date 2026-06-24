import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import useUIStore from "../../store/ui.store";
import { formatCurrency } from "../../utils/formatCurrency";
import styles from "./CreateExpenseModal.module.scss";

const SPLIT_TYPES = [
  { id: "EQUAL", label: "Igual" },
  { id: "PERCENTAGE", label: "Porcentaje" },
  { id: "EXACT", label: "Exacto" },
];

function buildInitialParticipants(members) {
  return members.map((m) => ({
    memberId: m.id,
    alias: m.alias,
    userId: m.userId ?? null,
    checked: true,
    value: "",
  }));
}

/** Distributes 100% equally among checked participants (2 decimal precision). */
function distributeEqualPct(participants) {
  const checked = participants.filter((p) => p.checked);
  const n = checked.length;
  if (n === 0) return participants;

  const base = Math.floor((100 / n) * 100) / 100;
  const remainder = +(100 - base * n).toFixed(2);
  let distributed = 0;

  return participants.map((p) => {
    if (!p.checked) return { ...p, value: "" };
    distributed++;
    const isLast = distributed === n;
    return {
      ...p,
      value: String(isLast ? +(base + remainder).toFixed(2) : base),
    };
  });
}

/** Distributes `total` equally among checked participants (2 decimal precision). */
function distributeEqualExact(participants, total) {
  const checked = participants.filter((p) => p.checked);
  const n = checked.length;
  if (n === 0 || total <= 0)
    return participants.map((p) => ({ ...p, value: "" }));

  const base = Math.floor((total / n) * 100) / 100;
  const remainder = +(total - base * n).toFixed(2);
  let distributed = 0;

  return participants.map((p) => {
    if (!p.checked) return { ...p, value: "" };
    distributed++;
    const isLast = distributed === n;
    return {
      ...p,
      value: String(isLast ? +(base + remainder).toFixed(2) : base),
    };
  });
}

export default function CreateExpenseModal({
  isOpen,
  onClose,
  members,
  onCreate,
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [splitType, setSplitType] = useState("EQUAL");
  const [participants, setParticipants] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const showToast = useUIStore((s) => s.showToast);
  const payableMembers = members.filter((m) => m.userId);

  useEffect(() => {
    if (isOpen) {
      setParticipants(buildInitialParticipants(members));
      setPayerId(payableMembers[0]?.userId ?? "");
    }
  }, [isOpen, members]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkedParticipants = participants.filter((p) => p.checked);
  const totalAmount = Number(amount) || 0;

  const pctSum = checkedParticipants.reduce(
    (acc, p) => acc + (Number(p.value) || 0),
    0,
  );
  const pctOk = Math.abs(pctSum - 100) <= 0.01;

  const getEqualShare = () => {
    const n = checkedParticipants.length;
    if (n === 0 || totalAmount === 0) return 0;
    return totalAmount / n;
  };

  const getPctAmount = (pctValue) => {
    if (!totalAmount || !pctValue) return null;
    return totalAmount * (Number(pctValue) / 100);
  };

  // When amount changes in EXACT mode, redistribute automatically
  useEffect(() => {
    if (splitType === "EXACT") {
      setParticipants((prev) =>
        distributeEqualExact(prev, Number(amount) || 0),
      );
    }
  }, [amount, splitType]);

  const handleSplitTypeChange = (type) => {
    setSplitType(type);
    if (type === "PERCENTAGE") {
      setParticipants((prev) => distributeEqualPct(prev));
    } else if (type === "EXACT") {
      setParticipants((prev) => distributeEqualExact(prev, totalAmount));
    } else {
      setParticipants((prev) => prev.map((p) => ({ ...p, value: "" })));
    }
  };

  const toggleParticipant = (memberId) => {
    setParticipants((prev) => {
      const toggled = prev.map((p) =>
        p.memberId === memberId ? { ...p, checked: !p.checked } : p,
      );
      if (splitType === "PERCENTAGE") return distributeEqualPct(toggled);
      if (splitType === "EXACT")
        return distributeEqualExact(toggled, totalAmount);
      return toggled;
    });
  };

  const updateValue = (memberId, value) => {
    setParticipants((prev) =>
      prev.map((p) => (p.memberId === memberId ? { ...p, value } : p)),
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!description.trim())
      newErrors.description = "El concepto es obligatorio";
    if (!amount || Number(amount) <= 0)
      newErrors.amount = "El importe debe ser mayor que 0";
    if (!payerId) newErrors.payerId = "Selecciona un pagador";
    if (checkedParticipants.length === 0)
      newErrors.participants = "Selecciona al menos un participante";

    if (splitType === "PERCENTAGE" && !pctOk) {
      newErrors.split = `Los porcentajes suman ${pctSum.toFixed(2)}%, deben sumar exactamente 100%`;
    }

    if (splitType === "EXACT") {
      const sum = checkedParticipants.reduce(
        (acc, p) => acc + (Number(p.value) || 0),
        0,
      );
      if (Math.abs(sum - totalAmount) > 0.01) {
        newErrors.split = `Los importes suman ${formatCurrency(sum)}, deben sumar ${formatCurrency(totalAmount)}`;
      }
    }

    return newErrors;
  };

  const buildParticipantsPayload = () =>
    checkedParticipants.map((p) => {
      const base = { userId: p.userId };
      if (splitType === "EXACT")
        return { ...base, shareAmount: Number(p.value) };
      if (splitType === "PERCENTAGE")
        return { ...base, percentage: Number(p.value) };
      return base;
    });

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
      await onCreate({
        description: description.trim(),
        amount: Number(amount),
        paidById: payerId,
        splitType,
        participants: buildParticipantsPayload(),
      });
      showToast("Gasto añadido", "success");
      handleClose();
    } catch (err) {
      const message = err.response?.data?.message ?? "Error al crear el gasto";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescription("");
    setAmount("");
    setPayerId(payableMembers[0]?.userId ?? "");
    setSplitType("EQUAL");
    setParticipants(buildInitialParticipants(members));
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Añadir gasto"
      footer={
        <Button
          type="submit"
          form="create-expense-form"
          fullWidth
          loading={loading}
        >
          Añadir gasto
        </Button>
      }
    >
      <form
        id="create-expense-form"
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
      >
        <Input
          label="Concepto"
          id="expense-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          placeholder="Ej: Cena en restaurante"
        />

        <Input
          label="Importe total (€)"
          type="number"
          id="expense-amount"
          name="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          min="0.01"
          step="0.01"
          placeholder="0,00"
        />

        <div>
          <span className={styles.selectLabel}>Pagado por</span>
          <select
            className={styles.select}
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            aria-label="Pagador"
          >
            {payableMembers.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.alias}
              </option>
            ))}
          </select>
          {errors.payerId && (
            <span className={styles.validationMsg}>{errors.payerId}</span>
          )}
        </div>

        <div>
          <p className={styles.sectionLabel}>Dividir</p>
          <div className={styles.splitTypeGroup}>
            {SPLIT_TYPES.map((st) => (
              <button
                key={st.id}
                type="button"
                className={`${styles.splitTypeBtn} ${splitType === st.id ? styles.active : ""}`}
                onClick={() => handleSplitTypeChange(st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={styles.sectionLabel}>Participantes</p>
          <ul className={styles.participantList}>
            {participants.map((p) => (
              <li key={p.memberId} className={styles.participantRow}>
                <Checkbox
                  checked={p.checked}
                  onChange={() => toggleParticipant(p.memberId)}
                  label={p.alias}
                />

                {p.checked && splitType === "EQUAL" && (
                  <span className={styles.participantAmount}>
                    {formatCurrency(getEqualShare())}
                  </span>
                )}

                {p.checked && splitType === "PERCENTAGE" && (
                  <div className={styles.participantRightGroup}>
                    <div className={styles.participantInput}>
                      <Input
                        type="number"
                        id={`pct-${p.memberId}`}
                        name={`pct-${p.memberId}`}
                        value={p.value}
                        onChange={(e) =>
                          updateValue(p.memberId, e.target.value)
                        }
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <span className={styles.pctPreview}>
                      {getPctAmount(p.value) !== null
                        ? formatCurrency(getPctAmount(p.value))
                        : "—"}
                    </span>
                  </div>
                )}

                {p.checked && splitType === "EXACT" && (
                  <div className={styles.participantInput}>
                    <Input
                      type="number"
                      id={`exact-${p.memberId}`}
                      name={`exact-${p.memberId}`}
                      value={p.value}
                      onChange={(e) => updateValue(p.memberId, e.target.value)}
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>

          {splitType === "PERCENTAGE" && checkedParticipants.length > 0 && (
            <div
              className={`${styles.sumBar} ${pctOk ? styles.ok : styles.pending}`}
            >
              <span>Total porcentajes</span>
              <span>{pctSum.toFixed(2)}% / 100%</span>
            </div>
          )}

          {splitType === "EXACT" &&
            checkedParticipants.length > 0 &&
            totalAmount > 0 &&
            (() => {
              const exactSum = checkedParticipants.reduce(
                (acc, p) => acc + (Number(p.value) || 0),
                0,
              );
              const exactOk = Math.abs(exactSum - totalAmount) <= 0.01;
              return (
                <div
                  className={`${styles.sumBar} ${exactOk ? styles.ok : styles.pending}`}
                >
                  <span>Total repartido</span>
                  <span>
                    {formatCurrency(exactSum)} / {formatCurrency(totalAmount)}
                  </span>
                </div>
              );
            })()}

          {errors.participants && (
            <span className={styles.validationMsg}>{errors.participants}</span>
          )}
          {errors.split && (
            <span className={styles.validationMsg}>{errors.split}</span>
          )}
        </div>
      </form>
    </Modal>
  );
}
