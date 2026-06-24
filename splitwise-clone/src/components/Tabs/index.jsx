import styles from "./Tabs.module.scss";

/**
 * @param {{ tabs: { id: string, label: string }[], activeTab: string, onChange: (id:string)=>void, children: React.ReactNode }} props
 */
export default function Tabs({ tabs, activeTab, onChange, children }) {
  return (
    <div className={styles.tabs}>
      <div className={styles.tabList} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id={`panel-${activeTab}`} role="tabpanel" className={styles.panel}>
        {children}
      </div>
    </div>
  );
}
