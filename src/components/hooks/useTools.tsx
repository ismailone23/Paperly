"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { indexedDBService, ToolData } from "@/lib/indexedDB";

type ToolType = "pen" | "pencil" | "eraser";

export const colors = [
  "#000000",
  "#EF4444",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
  "#F97316",
];

interface ToolsState {
  activeTool: ToolType;
  penColor: string;
  pencilColor: string;
  penWidth: number;
  pencilWidth: number;
  pageCount: number;
  currentPage: number;
  history: ImageData[];
  historyStep: number;
  pages: Map<number, ImageData>;
}

interface ToolsContextType extends ToolsState {
  slug: string | null;
  setSlug: (slug: string) => void;
  setActiveTool: (tool: ToolType) => void;
  setPenColor: (color: string) => void;
  setPencilColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  setPencilWidth: (width: number) => void;
  setPageCount: (count: number) => void;
  setCurrentPage: (page: number) => void;
  addToHistory: (item: ImageData) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  savePageData: (page: number, data: ImageData) => void;
  getPageData: (page: number) => ImageData | undefined;
  reorderPages: (fromPage: number, toPage: number) => void;
  clearState: () => void;
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

export const ToolsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [slug, setSlugState] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>("pen");
  const [penColor, setPenColor] = useState<string>("#000000");
  const [pencilColor, setPencilColor] = useState<string>("#6B7280");
  const [penWidth, setPenWidth] = useState<number>(3);
  const [pencilWidth, setPencilWidth] = useState<number>(2);
  const [pageCount, setPageCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  const [pages, setPages] = useState<Map<number, ImageData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedSlug, setHasLoadedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || typeof window === "undefined") return;

    if (hasLoadedSlug === slug) return;

    const loadData = async () => {
      setIsLoading(true);

      // Clear state first
      setActiveTool("pen");
      setPenColor("#000000");
      setPencilColor("#6B7280");
      setPenWidth(3);
      setPencilWidth(2);
      setPageCount(1);
      setCurrentPage(1);
      setHistory([]);
      setHistoryStep(-1);
      setPages(new Map());

      try {
        const savedData = await indexedDBService.load(slug);

        if (savedData) {
          setActiveTool((savedData.activeTool as ToolType) || "pen");
          setPenColor(savedData.penColor || "#000000");
          setPencilColor(savedData.pencilColor || "#6B7280");
          setPenWidth(savedData.penWidth || 3);
          setPencilWidth(savedData.pencilWidth || 2);
          setPageCount(savedData.pageCount || 1);
          setCurrentPage(savedData.currentPage || 1);
          setHistoryStep(savedData.historyStep || -1);

          // Load history
          if (savedData.history && Array.isArray(savedData.history)) {
            setHistory(savedData.history);
          }

          // Load pages
          if (savedData.pages) {
            const deserializedPages = new Map<number, ImageData>();
            Object.entries(savedData.pages).forEach(
              ([key, value]: [string, ImageData]) => {
                if (value) {
                  deserializedPages.set(Number(key), value);
                }
              },
            );
            setPages(deserializedPages);
          }
        }

        setHasLoadedSlug(slug);
      } catch (error) {
        console.error("Error loading tool state from IndexedDB:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug]); // Only depend on slug

  // Save state to IndexedDB whenever it changes (debounced)
  useEffect(() => {
    if (
      !slug ||
      typeof window === "undefined" ||
      isLoading ||
      hasLoadedSlug !== slug
    )
      return;

    const saveData = async () => {
      try {
        // Convert pages Map to object
        const serializedPages: { [key: number]: ImageData } = {};
        pages.forEach((value, key) => {
          serializedPages[key] = value;
        });

        const dataToSave: ToolData = {
          activeTool,
          penColor,
          pencilColor,
          penWidth,
          pencilWidth,
          pageCount,
          currentPage,
          historyStep,
          history,
          pages: serializedPages,
        };

        await indexedDBService.save(slug, dataToSave);
      } catch (error) {
        console.error("Error saving tool state to IndexedDB:", error);
      }
    };

    const timeoutId = setTimeout(saveData, 300);
    return () => clearTimeout(timeoutId);
  }, [
    slug,
    activeTool,
    penColor,
    pencilColor,
    penWidth,
    pencilWidth,
    pageCount,
    currentPage,
    history,
    historyStep,
    pages,
    isLoading,
    hasLoadedSlug,
  ]);

  const setSlug = (newSlug: string) => {
    // Reset the hasLoadedSlug flag when slug changes
    if (newSlug !== slug) {
      setHasLoadedSlug(null);
    }
    setSlugState(newSlug);
  };

  const clearState = () => {
    setActiveTool("pen");
    setPenColor("#000000");
    setPencilColor("#6B7280");
    setPenWidth(3);
    setPencilWidth(2);
    setPageCount(1);
    setCurrentPage(1);
    setHistory([]);
    setHistoryStep(-1);
    setPages(new Map());
    setHasLoadedSlug(null);
  };

  const addToHistory = (item: ImageData) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(item);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
    }
  };

  const canUndo = () => historyStep > 0;
  const canRedo = () => historyStep < history.length - 1;

  const savePageData = (page: number, data: ImageData) => {
    setPages(new Map(pages.set(page, data)));
  };

  const getPageData = (page: number) => {
    return pages.get(page);
  };

  const reorderPages = (fromPage: number, toPage: number) => {
    if (fromPage === toPage) return;

    const newPages = new Map<number, ImageData>();
    const pageArray: Array<{ num: number; data: ImageData | undefined }> = [];

    for (let i = 1; i <= pageCount; i++) {
      pageArray.push({ num: i, data: pages.get(i) });
    }

    const draggedPageData = pageArray.splice(fromPage - 1, 1)[0];
    pageArray.splice(toPage - 1, 0, draggedPageData);

    pageArray.forEach((page, index) => {
      if (page.data) {
        newPages.set(index + 1, page.data);
      }
    });

    setPages(newPages);

    if (currentPage === fromPage) {
      setCurrentPage(toPage);
    } else if (fromPage < currentPage && toPage >= currentPage) {
      setCurrentPage(currentPage - 1);
    } else if (fromPage > currentPage && toPage <= currentPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <ToolsContext.Provider
      value={{
        slug,
        setSlug,
        activeTool,
        setActiveTool,
        penColor,
        setPenColor,
        pencilColor,
        setPencilColor,
        penWidth,
        setPenWidth,
        pencilWidth,
        setPencilWidth,
        pageCount,
        setPageCount,
        currentPage,
        setCurrentPage,
        history,
        historyStep,
        pages,
        addToHistory,
        undo,
        redo,
        canUndo,
        canRedo,
        savePageData,
        getPageData,
        reorderPages,
        clearState,
      }}
    >
      {children}
    </ToolsContext.Provider>
  );
};

export const useTools = (): ToolsContextType => {
  const context = useContext(ToolsContext);
  if (!context) {
    throw new Error("useTools must be used within a ToolsProvider");
  }
  return context;
};
