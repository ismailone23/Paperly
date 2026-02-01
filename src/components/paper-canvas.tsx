"use client";
import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useTools } from "./hooks/useTools";

const PaperCanvas = forwardRef((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [initializedSlug, setInitializedSlug] = useState<string | null>(null);

  const {
    activeTool,
    penColor,
    pencilColor,
    penWidth,
    pencilWidth,
    pageCount,
    currentPage,
    setCurrentPage,
    history,
    historyStep,
    addToHistory,
    savePageData,
    getPageData,
    slug,
  } = useTools();

  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  // Initialize canvas when slug changes
  useEffect(() => {
    if (!slug || slug === initializedSlug) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = A4_WIDTH;
    canvas.height = A4_HEIGHT;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    setContext(ctx);

    // Load existing page data or save initial blank page
    const existingData = getPageData(currentPage);
    if (existingData) {
      ctx.putImageData(existingData, 0, 0);
    } else {
      const imageData = ctx.getImageData(0, 0, A4_WIDTH, A4_HEIGHT);
      savePageData(currentPage, imageData);
      addToHistory(imageData);
    }

    setInitializedSlug(slug);
  }, [slug, currentPage]);

  // Handle undo/redo
  useEffect(() => {
    if (!context || historyStep < 0 || history.length === 0) return;

    const currentState = history[historyStep];
    if (currentState) {
      context.putImageData(currentState, 0, 0);
      // Save the state to the current page
      savePageData(currentPage, currentState);
    }
  }, [historyStep]);

  const saveCurrentPageData = () => {
    if (!context) return;
    const imageData = context.getImageData(0, 0, A4_WIDTH, A4_HEIGHT);
    savePageData(currentPage, imageData);
  };

  const loadPage = (pageNumber: number) => {
    if (!context) return;

    const pageData = getPageData(pageNumber);
    if (pageData) {
      context.putImageData(pageData, 0, 0);
    } else {
      // New blank page
      context.fillStyle = "white";
      context.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
      const imageData = context.getImageData(0, 0, A4_WIDTH, A4_HEIGHT);
      savePageData(pageNumber, imageData);
    }

    const imageData = context.getImageData(0, 0, A4_WIDTH, A4_HEIGHT);
    addToHistory(imageData);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return;

    // Save current page before switching
    saveCurrentPageData();

    // Update current page
    setCurrentPage(newPage);

    // Load new page
    loadPage(newPage);
  };

  const clearPage = () => {
    if (!context) return;

    context.fillStyle = "white";
    context.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    const imageData = context.getImageData(0, 0, A4_WIDTH, A4_HEIGHT);
    savePageData(currentPage, imageData);
    addToHistory(imageData);
  };

  // Handle new page addition
  useEffect(() => {
    if (pageCount > 0 && context) {
      // Save current page data when page count changes
      saveCurrentPageData();
    }
  }, [pageCount]);

  // Watch for external page changes
  useEffect(() => {
    if (context && slug === initializedSlug) {
      loadPage(currentPage);
    }
  }, [currentPage]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    currentPage,
    handlePageChange,
    clearPage,
    saveCurrentPageData,
  }));

  const getCursorStyle = () => {
    if (activeTool === "pen") return "crosshair";
    if (activeTool === "pencil") return "crosshair";
    if (activeTool === "eraser") return "grab";
    return "default";
  };

  const getCurrentColor = () => {
    if (activeTool === "pen") return penColor;
    if (activeTool === "pencil") return pencilColor;
    return "#000000";
  };

  const getCurrentWidth = () => {
    if (activeTool === "pen") return penWidth;
    if (activeTool === "pencil") return pencilWidth;
    return 20;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;

    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);

    if (activeTool === "eraser") {
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = 20;
      context.lineCap = "round";
      context.lineJoin = "round";
    } else {
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = getCurrentColor();
      context.lineWidth = getCurrentWidth();
      context.lineCap = "round";
      context.lineJoin = "round";

      if (activeTool === "pencil") {
        context.globalAlpha = 0.6;
      } else {
        context.globalAlpha = 1;
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !context) return;

    setIsDrawing(false);
    context.closePath();
    context.globalAlpha = 1;

    const imageData = context.getImageData(0, 0, A4_WIDTH, A4_HEIGHT);
    savePageData(currentPage, imageData);
    addToHistory(imageData);
  };

  return (
    <div className="flex justify-center items-start w-full flex-1 overflow-auto bg-gray-100 p-8">
      <div className="shadow-2xl bg-white rounded-sm">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            cursor: getCursorStyle(),
            touchAction: "none",
          }}
          className="border border-gray-300"
        />
      </div>
    </div>
  );
});

PaperCanvas.displayName = "PaperCanvas";

export default PaperCanvas;
