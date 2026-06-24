import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/auth.store";
import { useAuth } from "../../hooks/useAuth";
import { useGroups } from "../../hooks/useGroups";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import CreateGroupModal from "../../modals/CreateGroupModal";
import styles from "./HomePage.module.scss";

export default function HomePage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { groups, loading, error, createGroup } = useGroups();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.appName}>Splitwise</span>
        <div className={styles.headerActions}>
          {user && <span className={styles.userName}>{user.name}</span>}
          <Button variant="ghost" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.sectionHeader}>
          <h1 className={styles.sectionTitle}>Mis grupos</h1>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            Nuevo grupo
          </Button>
        </div>

        {loading && <Spinner size="md" />}

        {!loading && error && <p>{error}</p>}

        {!loading && !error && groups.length === 0 && (
          <EmptyState
            title="No tienes grupos todavía"
            description="Crea un grupo para empezar a registrar gastos compartidos."
            actionLabel="Crear grupo"
            onAction={() => setIsCreateOpen(true)}
          />
        )}

        {!loading && groups.length > 0 && (
          <ul className={styles.groupList}>
            {groups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  className={styles.groupCard}
                  onClick={() => navigate(`/group/${group.id}`)}
                >
                  <div>
                    <p className={styles.groupName}>{group.name}</p>
                    {group.description && (
                      <p className={styles.groupMeta}>{group.description}</p>
                    )}
                  </div>
                  <span className={styles.arrow}>›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={createGroup}
      />
    </div>
  );
}
