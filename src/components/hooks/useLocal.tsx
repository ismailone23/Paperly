import {
  ActionDispatch,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";

type Note = {
  id: string;
  slug: string;
  thumbnail?: string;
  timestamp?: number;
};

const STORAGE_KEY = "paperly_notes";

// Utility functions for localStorage operations
const storageUtils = {
  read: (): Note[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return [];
    }
  },

  write: (notes: Note[]): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  },

  add: (note: Note): Note[] => {
    const notes = storageUtils.read();
    const updatedNotes = [...notes, note];
    storageUtils.write(updatedNotes);
    return updatedNotes;
  },

  delete: (id: string): Note[] => {
    const notes = storageUtils.read();
    const updatedNotes = notes.filter((note) => note.id !== id);
    storageUtils.write(updatedNotes);
    return updatedNotes;
  },

  update: (note: Note): Note[] => {
    const notes = storageUtils.read();
    const updatedNotes = notes.map((n) => (n.id === note.id ? note : n));
    storageUtils.write(updatedNotes);
    return updatedNotes;
  },
};

enum NoteActionKind {
  ADD = "add-note",
  DELETE = "delete-note",
  UPDATE = "update-note",
}

interface NoteAction {
  type: NoteActionKind;
  payload: Note;
}

interface LStorageContext {
  dispatch: ActionDispatch<[action: NoteAction]>;
  state: Note[];
}
export const LStorageContext = createContext<LStorageContext>(
  {} as LStorageContext
);

function noteReducer(
  state: LStorageContext["state"],
  action: NoteAction
): Note[] {
  const { type, payload } = action;
  switch (type) {
    case NoteActionKind.ADD:
      return storageUtils.add(payload);
    case NoteActionKind.DELETE:
      return storageUtils.delete(payload.id);
    case NoteActionKind.UPDATE:
      return storageUtils.update(payload);
    default:
      return state;
  }
}

export function LStorageContextProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(noteReducer, [], () =>
    storageUtils.read()
  );

  useEffect(() => {
    storageUtils.write(state);
  }, [state]);

  return (
    <LStorageContext.Provider value={{ dispatch, state }}>
      {children}
    </LStorageContext.Provider>
  );
}

export default function useLocal() {
  const context = useContext(LStorageContext);
  if (!context) throw new Error("Context called outside of the provider!");
  return context;
}
