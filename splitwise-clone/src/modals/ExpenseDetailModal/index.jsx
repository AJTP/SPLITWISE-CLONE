import Modal from "../../components/Modal";
import { formatCurrency } from "../../utils/formatCurrency";
import styles from "./ExpenseDetailModal.module.scss";

const SPLIT_TYPE_LABELS = {
  EQUAL: "Partes iguales",
  PERCENTAGE: "Por porcentaje",
  EXACT: "Importes exactos",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function ExpenseDetailModal({
  isOpen,
  onClose,
  expense,
  members,
}) {
  if (!expense) return null;

  const payerAlias = () => {
    const member = members?.find((m) => m.userId === expense.paidById);
    return member?.alias ?? expense.paidBy?.name ?? "Desconocido";
  };

  const participantAlias = (userId) => {
    const member = members?.find((m) => m.userId === userId);
    return member?.alias ?? userId;
  };

  // Determine the split type from the first participant (they all share the same type)
  const splitType = expense.participants?.[0]?.splitType ?? "EQUAL";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del gasto">
      <div className={styles.content}>
        <div className={styles.header}>
          <p className={styles.description}>{expense.description}</p>
          <p className={styles.amount}>{formatCurrency(expense.amount)}</p>
        </div>

        <dl className={styles.meta}>
          <div className={styles.metaRow}>
            <dt>Fecha</dt>
            <dd>{formatDate(expense.date)}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Pagado por</dt>
            <dd>{payerAlias()}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>División</dt>
            <dd>{SPLIT_TYPE_LABELS[splitType] ?? splitType}</dd>
          </div>
        </dl>

        <div className={styles.participants}>
          <p className={styles.sectionLabel}>Participantes</p>
          {expense.participants?.length === 0 && (
            <p className={styles.empty}>Sin participantes registrados</p>
          )}
          <ul className={styles.participantList}>
            {expense.participants?.map((p) => (
              <li key={p.id ?? p.userId} className={styles.participantRow}>
                <span className={styles.participantName}>
                  {participantAlias(p.userId)}
                </span>
                <span className={styles.participantShare}>
                  {formatCurrency(p.shareAmount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
