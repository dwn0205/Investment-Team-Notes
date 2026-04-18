import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useListUsers } from "@workspace/api-client-react";

interface ActiveUser {
  id: string;
  fullName: string;
  role: string;
}

interface UserContextValue {
  activeUser: ActiveUser | null;
  setActiveUser: (user: ActiveUser) => void;
}

const UserContext = createContext<UserContextValue>({
  activeUser: null,
  setActiveUser: () => {},
});

const STORAGE_KEY = "investment-notes-active-user";

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: users } = useListUsers();
  const [activeUser, setActiveUserState] = useState<ActiveUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Once users load, pick the first if nothing is stored yet
  useEffect(() => {
    if (users && users.length > 0 && !activeUser) {
      const first = users[0];
      const user = { id: first.id, fullName: first.fullName, role: first.role };
      setActiveUserState(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, [users, activeUser]);

  const setActiveUser = (user: ActiveUser) => {
    setActiveUserState(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  };

  return (
    <UserContext.Provider value={{ activeUser, setActiveUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useActiveUser() {
  return useContext(UserContext);
}
