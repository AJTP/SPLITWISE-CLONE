import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroupDetail } from "../../hooks/useGroupDetail";
import Tabs from "../../components/Tabs";
import Spinner from "../../components/Spinner";
import ExpensesTab from "./ExpensesTab";
import BalancesTab from "./BalancesTab";
import styles from "./GroupDetailPage.module.scss";

const TABS = [
  { id: "expenses", label: "Gastos" },
  { id: "balances", label: "Balances" },
];

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("expenses");
  const { group, members, loading, error } = useGroupDetail(id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate("/home")}
        >
          ‹ Grupos
        </button>
        <h1 className={styles.groupName}>{group ? group.name : "—"}</h1>
        {/* spacer to center title */}
        <div style={{ width: 80 }} />
      </header>

      <main className={styles.content}>
        {loading && (
          <div className={styles.centered}>
            <Spinner size="lg" />
          </div>
        )}

        {!loading && error && <p>{error}</p>}

        {!loading && !error && group && (
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab}>
            {activeTab === "expenses" && (
              <ExpensesTab groupId={id} members={members} />
            )}
            {activeTab === "balances" && (
              <BalancesTab groupId={id} members={members} />
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
}
