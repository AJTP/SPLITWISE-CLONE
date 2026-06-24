import { useState, useEffect, useCallback } from "react";
import * as groupsApi from "../api/groups.api";

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await groupsApi.listGroups();
      setGroups(res.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar grupos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  /**
   * Creates a group with initial aliases in a single request.
   * @param {{ name: string, aliases: string[] }} data
   */
  const createGroup = useCallback(
    async ({ name, aliases }) => {
      const res = await groupsApi.createGroup({ name, aliases });
      await fetchGroups();
      return res.data;
    },
    [fetchGroups],
  );

  return { groups, loading, error, fetchGroups, createGroup };
}
