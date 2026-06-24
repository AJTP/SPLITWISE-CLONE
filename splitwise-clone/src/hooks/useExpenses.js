import { useState, useEffect, useCallback } from "react";
import * as expensesApi from "../api/expenses.api";

export function useExpenses(groupId) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await expensesApi.listExpenses(groupId);
      setExpenses(res.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar gastos");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = useCallback(
    async (data) => {
      const res = await expensesApi.createExpense(groupId, data);
      await fetchExpenses();
      return res.data;
    },
    [groupId, fetchExpenses],
  );

  return { expenses, loading, error, fetchExpenses, createExpense };
}
