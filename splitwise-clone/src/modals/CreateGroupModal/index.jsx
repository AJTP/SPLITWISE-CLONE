import { useState } from "react";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Button from "../../components/Button";
import useUIStore from "../../store/ui.store";
import styles from "./CreateGroupModal.module.scss";

export default function CreateGroupModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState([""]);
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(false);

  const showToast = useUIStore((s) => s.showToast);

  const addAlias = () => setAliases((prev) => [...prev, ""]);

  const updateAlias = (index, value) =>
    setAliases((prev) => prev.map((a, i) => (i === index ? value : a)));

  const removeAlias = (index) =>
    setAliases((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError("El nombre del grupo es obligatorio");
      return;
    }
    setNameError("");

    const cleanAliases = aliases.map((a) => a.trim()).filter(Boolean);

    setLoading(true);
    try {
      await onCreate({ name: name.trim(), aliases: cleanAliases });
      showToast("Grupo creado", "success");
      handleClose();
    } catch (err) {
      const message = err.response?.data?.message ?? "Error al crear el grupo";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setAliases([""]);
    setNameError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo grupo"
      footer={
        <Button
          type="submit"
          form="create-group-form"
          fullWidth
          loading={loading}
        >
          Crear grupo
        </Button>
      }
    >
      <form id="create-group-form" onSubmit={handleSubmit} noValidate>
        <Input
          label="Nombre del grupo"
          id="group-name"
          name="groupName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          placeholder="Ej: Viaje a Roma"
        />

        <div className={styles.aliasList}>
          <p>Participantes</p>
          {aliases.map((alias, index) => (
            <div key={index} className={styles.aliasRow}>
              <div className={styles.aliasInput}>
                <Input
                  id={`alias-${index}`}
                  name={`alias-${index}`}
                  value={alias}
                  onChange={(e) => updateAlias(index, e.target.value)}
                  placeholder={`Nombre del participante ${index + 1}`}
                />
              </div>
              {aliases.length > 1 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeAlias(index)}
                  aria-label={`Eliminar participante ${index + 1}`}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={styles.addBtn}
            onClick={addAlias}
          >
            + Añadir participante
          </Button>
        </div>
      </form>
    </Modal>
  );
}
