"use client";
import {
  Dispatch,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { indexedDBService } from "@/lib/indexedDB";
export type Note = {
  name: string;
  slug: string;
  thumbnail: string | null;
  timestamp: number;
};

export type Tool = {
  slug: string;
  pageCount: number;
};

export enum STORAGE_KEY {
  NOTE = "paperly_notes",
  TOOL = "paperly_tools",
}

export type LocalData = {
  notes: Note[];
  tools: Tool[];
};

const storageUtils = {
  read: (): LocalData => {
    if (typeof window === "undefined") {
      return { notes: [], tools: [] };
    }
    try {
      const noteStr = localStorage.getItem(STORAGE_KEY.NOTE);
      const toolStr = localStorage.getItem(STORAGE_KEY.TOOL);
      const parsedNotes = noteStr ? JSON.parse(noteStr) : [];
      const parsedTools = toolStr ? JSON.parse(toolStr) : [];
      return { notes: parsedNotes, tools: parsedTools };
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return { notes: [], tools: [] };
    }
  },
  write: ({ key, data }: { key: STORAGE_KEY; data: Note[] | Tool[] }): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  },
  deleteToolData: async (slug: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      // Delete from IndexedDB
      await indexedDBService.delete(slug);
    } catch (error) {
      console.error("Error deleting tool data from IndexedDB:", error);
    }
  },
};

export enum NoteAction {
  ADD = "add-note",
  DELETE = "delete-note",
  UPDATE = "update-note",
}

export enum ToolAction {
  ADD = "add-tool",
  DELETE = "delete-tool",
  UPDATE = "update-tool",
}

interface NoteActionType {
  type: NoteAction;
  payload: Note;
}

interface ToolActionType {
  type: ToolAction;
  payload: Tool;
}

type ActionType = NoteActionType | ToolActionType;

interface NoteContextType {
  dispatch: Dispatch<ActionType>;
  state: LocalData;
}

export const NoteContext = createContext<NoteContextType | undefined>(
  undefined,
);

function noteReducer(state: LocalData, action: ActionType): LocalData {
  const { type, payload } = action;

  if (
    "type" in action &&
    Object.values(NoteAction).includes(action.type as NoteAction)
  ) {
    const notePayload = payload as Note;
    switch (action.type) {
      case NoteAction.ADD:
        return {
          ...state,
          notes: [...state.notes, notePayload],
        };
      case NoteAction.DELETE:
        // Delete associated tool data when note is deleted
        storageUtils.deleteToolData(notePayload.slug); // This is now async but we don't await
        return {
          ...state,
          notes: state.notes.filter((note) => note.slug !== notePayload.slug),
          tools: state.tools.filter((tool) => tool.slug !== notePayload.slug),
        };
      case NoteAction.UPDATE:
        return {
          ...state,
          notes: state.notes.map((note) =>
            note.slug === notePayload.slug ? notePayload : note,
          ),
        };
    }
  }

  if (
    "type" in action &&
    Object.values(ToolAction).includes(action.type as ToolAction)
  ) {
    const toolPayload = payload as Tool;
    switch (action.type) {
      case ToolAction.ADD:
        return {
          ...state,
          tools: [...state.tools, toolPayload],
        };
      case ToolAction.DELETE:
        // Delete associated tool drawing data
        storageUtils.deleteToolData(toolPayload.slug);
        return {
          ...state,
          tools: state.tools.filter((tool) => tool.slug !== toolPayload.slug),
        };
      case ToolAction.UPDATE:
        return {
          ...state,
          tools: state.tools.map((tool) =>
            tool.slug === toolPayload.slug ? toolPayload : tool,
          ),
        };
    }
  }

  return state;
}

export function NoteContextProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    noteReducer,
    { notes: [], tools: [] },
    () => storageUtils.read(),
  );

  useEffect(() => {
    storageUtils.write({ key: STORAGE_KEY.NOTE, data: state.notes });
  }, [state.notes]);

  useEffect(() => {
    storageUtils.write({ key: STORAGE_KEY.TOOL, data: state.tools });
  }, [state.tools]);

  return (
    <NoteContext.Provider value={{ dispatch, state }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNote() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error("useNote must be used within NoteContextProvider!");
  }
  return context;
}
