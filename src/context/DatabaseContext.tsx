import type * as SQLite from "expo-sqlite";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { getDb, initDatabase } from "../database/db";

type DatabaseContextType = {
  db: SQLite.SQLiteDatabase | null;
  loading: boolean;
  error: Error | null;
};

const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined,
);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    async function initialize() {
      try {
        await initDatabase();
        const database = await getDb();
        if (mounted) {
          setDb(database);
          setLoading(false);
        }
      } catch (e) {
        console.error("Database initialization failed:", e);
        if (mounted) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      }
    }
    initialize();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, loading, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used inside a DatabaseProvider");
  }
  return context;
}
