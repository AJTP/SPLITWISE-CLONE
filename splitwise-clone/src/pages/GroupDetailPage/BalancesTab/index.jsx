import { useState } from "react";
import useAuthStore from "../../../store/auth.store";
import { useBalances } from "../../../hooks/useBalances";
import { useSettlements } from "../../../hooks/useSettlements";
import { formatCurrency } from "../../../utils/formatCurrency";
import Spinner from "../../../components/Spinner";
import SettleDebtModal from "../../../modals/SettleDebtModal";
import styles from "./BalancesTab.module.scss";

function amountClass(amount) {
  if (amount > 0) return styles.positive;
  if (amount < 0) return styles.negative;
  return styles.zero;
}

export default function BalancesTab({ groupId, members }) {
  const [selectedDebt, setSelectedDebt] = useState(null);
  const user = useAuthStore((s) => s.user);
  const { balances, simplifiedDebts, loading, error, fetchBalances } =
    useBalances(groupId);
  const { createSettlement } = useSettlements(groupId);

  const myBalance = balances.find((b) => b.userId === user?.id);

  const handleSettle = async ({ payerId, payeeId, amount }) => {
    await createSettlement({ payerId, payeeId, amount });
    await fetchBalances();
  };

  if (loading) return <Spinner size="md" />;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.tab}>
      {/* My balance */}
      {myBalance && (
        <div className={styles.myBalanceCard}>
          <span className={styles.myBalanceLabel}>Mi balance</span>
          <span
            className={`${styles.myBalanceAmount} ${amountClass(myBalance.amount)}`}
          >
            {myBalance.amount > 0 && "+"}
            {formatCurrency(myBalance.amount)}
          </span>
          {myBalance.amount > 0 && (
            <span className={styles.myBalanceLabel}>Te deben dinero</span>
          )}
          {myBalance.amount < 0 && (
            <span className={styles.myBalanceLabel}>Debes dinero</span>
          )}
          {myBalance.amount === 0 && (
            <span className={styles.myBalanceLabel}>Estás al corriente</span>
          )}
        </div>
      )}

      {/* All member balances */}
      {balances.length > 0 && (
        <div>
          <p className={styles.sectionTitle}>Balances del grupo</p>
          <ul className={styles.balanceList}>
            {balances.map((b) => (
              <li key={b.userId}>
                <div className={styles.balanceItem}>
                  <span className={styles.memberName}>{b.userName}</span>
                  <span className={`${styles.amount} ${amountClass(b.amount)}`}>
                    {b.amount > 0 && "+"}
                    {formatCurrency(b.amount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Simplified debts */}
      {simplifiedDebts.length > 0 && (
        <div>
          <p className={styles.sectionTitle}>Deudas pendientes</p>
          <ul className={styles.debtList}>
            {simplifiedDebts.map((debt, index) => {
              const isMyDebt = debt.fromUserId === user?.id;
              return (
                <li key={index}>
                  {isMyDebt ? (
                    <button
                      type="button"
                      className={`${styles.debtItem} ${styles.debtItemClickable}`}
                      onClick={() => setSelectedDebt(debt)}
                    >
                      <div>
                        <p className={styles.debtText}>
                          Debes a {debt.toUserName}
                        </p>
                        <p className={styles.settleHint}>
                          Toca para registrar el pago
                        </p>
                      </div>
                      <span className={styles.debtAmount}>
                        {formatCurrency(debt.amount)}
                      </span>
                    </button>
                  ) : (
                    <div className={styles.debtItem}>
                      <p className={styles.debtText}>
                        {debt.fromUserName} debe a {debt.toUserName}
                      </p>
                      <span className={styles.debtAmount}>
                        {formatCurrency(debt.amount)}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {simplifiedDebts.length === 0 && balances.length > 0 && (
        <p
          style={{ textAlign: "center", color: "var(--color-text-secondary)" }}
        >
          No hay deudas pendientes en este grupo.
        </p>
      )}

      <SettleDebtModal
        isOpen={Boolean(selectedDebt)}
        onClose={() => setSelectedDebt(null)}
        debt={selectedDebt}
        groupId={groupId}
        onSettle={handleSettle}
      />
    </div>
  );
}
