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

  // Physical display size (CSS pixels)
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  // Get device pixel ratio (2 for Retina, 3 for some tablets)
  const pixelRatio =
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  // Actual canvas size (multiply by pixel ratio for sharp rendering)
  const CANVAS_WIDTH = A4_WIDTH * pixelRatio;
  const CANVAS_HEIGHT = A4_HEIGHT * pixelRatio;

  // Initialize canvas when slug changes
  useEffect(() => {
    if (!slug || slug === initializedSlug) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Set actual canvas size (high resolution)
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Scale context to match pixel ratio
    ctx.scale(pixelRatio, pixelRatio);

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    setContext(ctx);

    // Load existing page data or save initial blank page
    const existingData = getPageData(currentPage);
    if (existingData) {
      ctx.putImageData(existingData, 0, 0);
    } else {
      const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
      savePageData(currentPage, currentState);
    }
  }, [historyStep]);

  const saveCurrentPageData = () => {
    if (!context) return;
    const imageData = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    savePageData(currentPage, imageData);
  };

  const loadPage = (pageNumber: number) => {
    if (!context) return;

    const pageData = getPageData(pageNumber);
    if (pageData) {
      context.putImageData(pageData, 0, 0);
    } else {
      context.fillStyle = "white";
      context.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
      const imageData = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      savePageData(pageNumber, imageData);
    }

    const imageData = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    addToHistory(imageData);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return;
    saveCurrentPageData();
    setCurrentPage(newPage);
    loadPage(newPage);
  };

  const clearPage = () => {
    if (!context) return;

    context.fillStyle = "white";
    context.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    const imageData = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    savePageData(currentPage, imageData);
    addToHistory(imageData);
  };

  useEffect(() => {
    if (pageCount > 0 && context) {
      saveCurrentPageData();
    }
  }, [pageCount]);

  useEffect(() => {
    if (context && slug === initializedSlug) {
      loadPage(currentPage);
    }
  }, [currentPage]);

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

  // Helper function to get coordinates from mouse or touch event
  const getCoordinates = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ): { x: number; y: number } | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;

    if ("touches" in e) {
      // Touch event
      if (e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return null;
  };

  const setupDrawingContext = () => {
    if (!context) return;

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

  // Mouse Events
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    context.beginPath();
    context.moveTo(coords.x, coords.y);
    setupDrawingContext();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    context.lineTo(coords.x, coords.y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !context) return;

    setIsDrawing(false);
    context.closePath();
    context.globalAlpha = 1;

    const imageData = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    savePageData(currentPage, imageData);
    addToHistory(imageData);
  };

  // Touch Events
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (!context) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    context.beginPath();
    context.moveTo(coords.x, coords.y);
    setupDrawingContext();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (!isDrawing || !context) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    context.lineTo(coords.x, coords.y);
    context.stroke();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (!isDrawing || !context) return;

    setIsDrawing(false);
    context.closePath();
    context.globalAlpha = 1;

    const imageData = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    savePageData(currentPage, imageData);
    addToHistory(imageData);
  };

  return (
    <div className="flex justify-center items-start w-full flex-1 overflow-auto bg-gray-100 p-8">
      <div className="shadow-2xl bg-white rounded-sm">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            width: `${A4_WIDTH}px`,
            height: `${A4_HEIGHT}px`,
            cursor: getCursorStyle(),
            touchAction: "none",
          }}
          // Mouse Events
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          // Touch Events
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="border border-gray-300"
        />
      </div>
    </div>
  );
});

PaperCanvas.displayName = "PaperCanvas";

export default PaperCanvas;
