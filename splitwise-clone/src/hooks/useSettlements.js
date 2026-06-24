import { useCallback } from "react";
import * as settlementsApi from "../api/settlements.api";

export function useSettlements(groupId) {
  const createSettlement = useCallback(
    async ({ payerId, payeeId, amount, notes }) => {
      const res = await settlementsApi.createSettlement(groupId, {
        payerId,
        payeeId,
        amount,
        notes,
      });
      return res.data;
    },
    [groupId],
  );

  return { createSettlement };
}
