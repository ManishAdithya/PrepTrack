import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import API from "../api";

const UserCtx = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⭐ Load user from API on refresh
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ⭐ FIX: Instantly update user when login happens
  useEffect(() => {
    const handleLogin = () => {
      // the token is saved by now, so fetch the full profile
      API.get("/auth/me")
        .then(({ data }) => setUser(data))
        .catch((err) => console.error("Failed to fetch user:", err));
    };

    window.addEventListener("user-logged-in", handleLogin);
    return () => window.removeEventListener("user-logged-in", handleLogin);
  }, []);

  const value = useMemo(() => ({ user, setUser, loading }), [user, loading]);
  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

export function useUser() {
  return useContext(UserCtx);
}
