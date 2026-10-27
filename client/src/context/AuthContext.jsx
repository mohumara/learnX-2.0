import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getMe, registerAccount, updateMe } from '../services/auth';

const AuthContext = createContext(null);

/**
 * Holds the signed-in user's profile ({ uid, name, email, role, bookmarks }).
 * Firebase handles the session; the profile (and role) comes from our API.
 */
export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }
        try {
          setProfile(await getMe());
        } catch {
          setProfile(null);
        }
        setLoading(false);
      }),
    []
  );

  const login = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    const me = await getMe();
    setProfile(me);
    return me;
  }, []);

  const register = useCallback(
    async (data) => {
      await registerAccount(data);
      return login(data.email, data.password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
  }, []);

  const updateName = useCallback(async (name) => setProfile(await updateMe({ name })), []);
  const setBookmarks = useCallback((bookmarks) => setProfile((p) => (p ? { ...p, bookmarks } : p)), []);

  const value = useMemo(
    () => ({ profile, loading, login, register, logout, updateName, setBookmarks }),
    [profile, loading, login, register, logout, updateName, setBookmarks]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
