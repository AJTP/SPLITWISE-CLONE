import { useState, useEffect, useCallback } from "react";
import * as groupsApi from "../api/groups.api";

export function useGroupDetail(groupId) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const [groupRes, membersRes] = await Promise.all([
        groupsApi.getGroup(groupId),
        groupsApi.listMembers(groupId),
      ]);
      setGroup(groupRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar el grupo");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  return { group, members, loading, error, fetchGroup };
}
