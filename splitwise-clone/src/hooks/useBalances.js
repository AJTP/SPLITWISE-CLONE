import { useState, useEffect, useCallback } from "react";
import * as balancesApi from "../api/balances.api";

export function useBalances(groupId) {
  const [balances, setBalances] = useState([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalances = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await balancesApi.getBalances(groupId);
      setBalances(res.data.balances ?? []);
      setSimplifiedDebts(res.data.simplifiedDebts ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar balances");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, simplifiedDebts, loading, error, fetchBalances };
}
