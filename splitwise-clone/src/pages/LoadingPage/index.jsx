import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/auth.store";
import * as authApi from "../../api/auth.api";
import Spinner from "../../components/Spinner";
import styles from "./LoadingPage.module.scss";

export default function LoadingPage() {
  const { refreshToken, accessToken, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSession() {
      // No token at all — go to login immediately
      if (!refreshToken && !accessToken) {
        navigate("/login", { replace: true });
        return;
      }

      // Has a refreshToken — try to renew access
      if (refreshToken) {
        try {
          const res = await authApi.refreshToken({ refreshToken });
          const { token, user } = res.data;
          setAuth({ accessToken: token, refreshToken, user });
          navigate("/home", { replace: true });
        } catch {
          clearAuth();
          navigate("/login", { replace: true });
        }
        return;
      }

      // Has only accessToken (no refresh endpoint yet) — go to home optimistically
      navigate("/home", { replace: true });
    }

    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.page}>
      <span className={styles.appName}>Splitwise</span>
      <Spinner size="lg" />
    </div>
  );
}
