import { useState } from "react";
import useAuthStore from "../../../store/auth.store";
import { useExpenses } from "../../../hooks/useExpenses";
import { formatCurrency } from "../../../utils/formatCurrency";
import { groupByDate } from "../../../utils/groupByDate";
import Button from "../../../components/Button";
import Spinner from "../../../components/Spinner";
import EmptyState from "../../../components/EmptyState";
import CreateExpenseModal from "../../../modals/CreateExpenseModal";
import ExpenseDetailModal from "../../../modals/ExpenseDetailModal";
import styles from "./ExpensesTab.module.scss";

export default function ExpensesTab({ groupId, members }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const user = useAuthStore((s) => s.user);
  const { expenses, loading, error, createExpense } = useExpenses(groupId);

  const totalGroup = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const myExpenses = expenses.reduce((sum, e) => {
    const myShare = e.participants?.find((p) => p.userId === user?.id);
    return sum + (myShare ? Number(myShare.shareAmount) : 0);
  }, 0);

  const grouped = groupByDate(expenses, "date");

  const payerAlias = (expense) => {
    const member = members.find((m) => m.userId === expense.paidById);
    return member?.alias ?? expense.paidBy?.name ?? "Desconocido";
  };

  const isInvolved = (expense) =>
    expense.paidById === user?.id ||
    expense.participants?.some((p) => p.userId === user?.id);

  return (
    <div className={styles.tab}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Mi gasto</span>
          <span className={styles.summaryAmount}>
            {formatCurrency(myExpenses)}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total grupo</span>
          <span className={styles.summaryAmount}>
            {formatCurrency(totalGroup)}
          </span>
        </div>
      </div>

      {loading && <Spinner size="md" />}
      {!loading && error && <p>{error}</p>}

      {!loading && !error && expenses.length === 0 && (
        <EmptyState
          title="Sin gastos todavía"
          description="Añade el primer gasto del grupo."
        />
      )}

      {!loading &&
        grouped.map(({ label, items }) => (
          <div key={label} className={styles.section}>
            <p className={styles.dateLabel}>{label}</p>
            <ul className={styles.expenseList}>
              {items.map((expense) => (
                <li key={expense.id}>
                  <button
                    type="button"
                    className={`${styles.expenseItem} ${isInvolved(expense) ? styles.involved : ""}`}
                    onClick={() => setSelectedExpense(expense)}
                  >
                    <div className={styles.expenseInfo}>
                      <span className={styles.expenseConcept}>
                        {expense.description}
                      </span>
                      <span className={styles.expensePayer}>
                        Pagó {payerAlias(expense)}
                      </span>
                    </div>
                    <span className={styles.expenseAmount}>
                      {formatCurrency(expense.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

      <Button className={styles.addBtn} onClick={() => setIsCreateOpen(true)}>
        Añadir gasto
      </Button>

      <CreateExpenseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        members={members}
        onCreate={createExpense}
      />

      <ExpenseDetailModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        members={members}
      />
    </div>
  );
}
