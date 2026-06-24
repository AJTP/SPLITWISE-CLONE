import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/auth.api";
import useAuthStore from "../store/auth.store";
import useUIStore from "../store/ui.store";

export function useAuth() {
  const { setAuth, clearAuth } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);
  const navigate = useNavigate();

  const login = useCallback(
    async ({ email, password }) => {
      const res = await authApi.login({ email, password });
      const { token, user } = res.data;
      setAuth({ accessToken: token, refreshToken: null, user });
      navigate("/home");
    },
    [setAuth, navigate],
  );

  const register = useCallback(async ({ name, email, password }) => {
    await authApi.register({ name, email, password });
  }, []);

  const forgotPassword = useCallback(async ({ email }) => {
    await authApi.forgotPassword({ email });
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    navigate("/login");
  }, [clearAuth, navigate]);

  return { login, register, forgotPassword, logout };
}
