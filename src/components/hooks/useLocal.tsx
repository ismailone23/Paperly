"use client";
import {
  ActionDispatch,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";

export type Note = {
  name: string;
  slug: string;
  thumbnail: string | null;
  timestamp: Date;
};

const STORAGE_KEY = "paperly_notes";

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
};

export enum NoteAction {
  ADD = "add-note",
  DELETE = "delete-note",
  UPDATE = "update-note",
}

interface NoteActionType {
  type: NoteAction;
  payload: Note;
}

interface LStorageContextType {
  dispatch: ActionDispatch<[action: NoteActionType]>;
  state: Note[];
}
export const LStorageContext = createContext<LStorageContextType>(
  {} as LStorageContextType,
);

function noteReducer(
  state: LStorageContextType["state"],
  action: NoteActionType,
): Note[] {
  const { type, payload } = action;
  switch (type) {
    case NoteAction.ADD:
      return [...state, payload];
    case NoteAction.DELETE:
      return state.filter((note) => note.slug !== payload.slug);
    case NoteAction.UPDATE:
      return state.map((note) => (note.slug === payload.slug ? payload : note));
    default:
      return state;
  }
}

export function LStorageContextProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(noteReducer, [], () =>
    storageUtils.read(),
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
