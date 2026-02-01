"use client";
import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { useTools } from "./hooks/useTools";

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

const PaperCanvas = forwardRef((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [initializedSlug, setInitializedSlug] = useState<string | null>(null);

  // For smooth drawing - using refs to avoid re-renders during drawing
  const currentStrokeRef = useRef<Point[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const isDrawingRef = useRef(false);

  // For pan and zoom on touch devices
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Fixed pixel ratio of 2 for consistent rendering across all devices
  const pixelRatio = 2;

  // Actual canvas size (multiply by pixel ratio for sharp rendering)
  const CANVAS_WIDTH = A4_WIDTH * pixelRatio;
  const CANVAS_HEIGHT = A4_HEIGHT * pixelRatio;

  // Initialize canvas when slug changes
  useEffect(() => {
    if (!slug || slug === initializedSlug) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) return;

    // Set actual canvas size (high resolution)
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Scale context to match pixel ratio
    ctx.scale(pixelRatio, pixelRatio);

    // Clear canvas with white background
    ctx.fillStyle = "#ffffff";
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

    // Reset zoom and pan for new note
    setScale(1);
    setOffset({ x: 0, y: 0 });
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
      context.fillStyle = "#ffffff";
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

    context.fillStyle = "#ffffff";
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

  // Helper function to get coordinates from pointer event
  const getCoordinates = useCallback(
    (e: PointerEvent | React.PointerEvent<HTMLCanvasElement>): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      const x = ((e.clientX - rect.left) / displayWidth) * A4_WIDTH;
      const y = ((e.clientY - rect.top) / displayHeight) * A4_HEIGHT;

      return { x, y, pressure: e.pressure || 0.5 };
    },
    [A4_WIDTH, A4_HEIGHT],
  );

  // Pointer Events for drawing
  const startDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!context || isPanning) return;

      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);

      const coords = getCoordinates(e);
      if (!coords) return;

      isDrawingRef.current = true;
      currentStrokeRef.current = [coords];

      // Setup context with current tool settings directly
      if (activeTool === "eraser") {
        context.globalCompositeOperation = "destination-out";
        context.strokeStyle = "#000000";
        context.fillStyle = "#000000";
        context.lineWidth = 20;
        context.globalAlpha = 1;
      } else {
        context.globalCompositeOperation = "source-over";
        const color = activeTool === "pen" ? penColor : pencilColor;
        const width = activeTool === "pen" ? penWidth : pencilWidth;
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = width;
        context.globalAlpha = activeTool === "pencil" ? 0.6 : 1;
      }
      context.lineCap = "round";
      context.lineJoin = "round";

      // Start continuous path and draw initial dot
      context.beginPath();
      context.moveTo(coords.x, coords.y);
      context.arc(coords.x, coords.y, context.lineWidth / 4, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.moveTo(coords.x, coords.y);
    },
    [
      context,
      getCoordinates,
      isPanning,
      activeTool,
      penColor,
      pencilColor,
      penWidth,
      pencilWidth,
    ],
  );

  const draw = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !context || isPanning) return;
      e.preventDefault();

      const coords = getCoordinates(e);
      if (!coords) return;

      // Continue path smoothly
      context.lineTo(coords.x, coords.y);
      context.stroke();
      context.beginPath();
      context.moveTo(coords.x, coords.y);

      currentStrokeRef.current.push(coords);
    },
    [context, getCoordinates, isPanning],
  );

  const stopDrawing = useCallback(
    (e?: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !context) return;

      if (e) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
      }

      isDrawingRef.current = false;
      context.globalAlpha = 1;
      currentStrokeRef.current = [];

      // Save state after stroke completion
      const imageData = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      savePageData(currentPage, imageData);
      addToHistory(imageData);
    },
    [
      context,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      currentPage,
      savePageData,
      addToHistory,
    ],
  );

  // Touch Events for multi-touch gestures (pinch-zoom and pan)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      // Two-finger touch = zoom/pan gesture
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsPanning(true);
        isDrawingRef.current = false;

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
        lastTouchDistanceRef.current = distance;

        // Calculate midpoint for panning
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        lastPanPointRef.current = { x: midX, y: midY };
      }
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      // Handle pinch-to-zoom and pan with two fingers
      if (e.touches.length === 2 && isPanning) {
        e.preventDefault();

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        // Zoom
        if (lastTouchDistanceRef.current !== null) {
          const scaleChange = distance / lastTouchDistanceRef.current;
          setScale((prev) => Math.min(Math.max(prev * scaleChange, 0.5), 2.5));
        }
        lastTouchDistanceRef.current = distance;

        // Pan
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        if (lastPanPointRef.current) {
          const deltaX = midX - lastPanPointRef.current.x;
          const deltaY = midY - lastPanPointRef.current.y;
          setOffset((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }));
        }
        lastPanPointRef.current = { x: midX, y: midY };
      }
    },
    [isPanning],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length < 2) {
        setIsPanning(false);
        lastTouchDistanceRef.current = null;
        lastPanPointRef.current = null;
      }
    },
    [],
  );

  // Reset zoom and pan
  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex justify-center items-start w-full flex-1 overflow-auto bg-gray-100 p-4 md:p-8"
    >
      {/* Zoom level indicator - tap to reset */}
      {scale !== 1 && (
        <button
          onClick={resetView}
          className="fixed bottom-20 right-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-xs font-medium active:bg-gray-100 md:hidden"
          type="button"
        >
          {Math.round(scale * 100)}%
        </button>
      )}

      <div
        className="shadow-2xl bg-white rounded-sm"
        style={{
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          transformOrigin: "top center",
        }}
      >
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
          // Pointer Events for drawing
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
          // Touch Events for pinch-zoom
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
