import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import API from "../api";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { bigCelebrate } from "../utils/confetti.js";
import { levelFor, useStreak } from "../utils/gamification.js";

// XP, level, rank and streak for the logged-in student, derived from the leaderboard.
const GameCtx = createContext(null);

export function GameProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const streak = useStreak();
  const [leaders, setLeaders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const levelRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await API.get("/leaderboard");
      const sorted = [...data].sort((a, b) => (b.score || 0) - (a.score || 0));
      setLeaders(sorted);
      return sorted;
    } catch {
      return [];
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const index = leaders.findIndex((l) => l.isMe);
  const me = index >= 0 ? leaders[index] : null;
  const xp = me?.score || 0;
  const level = levelFor(xp);
  const rank = index >= 0 ? index + 1 : null;
  const ahead = index > 0 ? leaders[index - 1] : null;

  // Celebrate when a refresh pushes the student into a new level
  useEffect(() => {
    if (!loaded) return;
    if (levelRef.current !== null && level.level > levelRef.current) {
      bigCelebrate();
      toast({ type: "reward", title: `Level up! You reached Level ${level.level}`, description: `New title: ${level.title}` });
    }
    levelRef.current = level.level;
  }, [level.level, level.title, loaded, toast]);

  const value = useMemo(
    () => ({
      leaders,
      me,
      xp,
      level,
      rank,
      ahead,
      streak,
      contributions: me?.contributions || 0,
      refresh: load,
    }),
    [leaders, me, xp, level, rank, ahead, streak, load]
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame() {
  return useContext(GameCtx);
}
