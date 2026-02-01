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
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [initializedSlug, setInitializedSlug] = useState<string | null>(null);

  // For smooth drawing - using refs to avoid re-renders during drawing
  const currentStrokeRef = useRef<Point[]>([]);
  const lastPointRef = useRef<Point | null>(null);
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

  // Limit pixel ratio to 2 for performance on high-DPI devices
  const pixelRatio =
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1;

  // Actual canvas size (multiply by pixel ratio for sharp rendering)
  const CANVAS_WIDTH = A4_WIDTH * pixelRatio;
  const CANVAS_HEIGHT = A4_HEIGHT * pixelRatio;

  // Initialize canvas when slug changes
  useEffect(() => {
    if (!slug || slug === initializedSlug) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      willReadFrequently: false,
      alpha: false, // Performance optimization
    });
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

    // Reset zoom/pan for new note
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
  const getCoordinates = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
        | PointerEvent,
    ): Point | null => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return null;

      let clientX: number,
        clientY: number,
        pressure = 0.5;

      if ("touches" in e) {
        // Touch event
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          clientX = touch.clientX;
          clientY = touch.clientY;
          // @ts-ignore - force property exists on some devices
          pressure = touch.force || 0.5;
        } else {
          return null;
        }
      } else if ("clientX" in e) {
        // Mouse or Pointer event
        clientX = e.clientX;
        clientY = e.clientY;
        // @ts-ignore - pressure exists on PointerEvent
        pressure = e.pressure || 0.5;
      } else {
        return null;
      }

      // Account for scale when calculating coordinates
      const scaleX = (rect.width / A4_WIDTH) * scale;
      const scaleY = (rect.height / A4_HEIGHT) * scale;

      return {
        x: (clientX - rect.left) / scaleX,
        y: (clientY - rect.top) / scaleY,
        pressure,
      };
    },
    [scale, A4_WIDTH, A4_HEIGHT],
  );

  const setupDrawingContext = useCallback(() => {
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
  }, [context, activeTool, getCurrentColor, getCurrentWidth]);

  // Optimized smooth line drawing using quadratic curves
  const drawSmoothLine = useCallback(
    (points: Point[]) => {
      if (!context || points.length < 2) return;

      const lastTwo = points.slice(-2);
      context.beginPath();
      context.moveTo(lastTwo[0].x, lastTwo[0].y);
      context.lineTo(lastTwo[1].x, lastTwo[1].y);
      context.stroke();
    },
    [context],
  );

  // Batched drawing using requestAnimationFrame
  const flushDrawBuffer = useCallback(() => {
    if (!context || currentStrokeRef.current.length < 2) {
      animationFrameRef.current = null;
      return;
    }

    setupDrawingContext();
    drawSmoothLine(currentStrokeRef.current);
    animationFrameRef.current = null;
  }, [context, setupDrawingContext, drawSmoothLine]);

  const scheduleFlush = useCallback(() => {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(flushDrawBuffer);
    }
  }, [flushDrawBuffer]);

  // Mouse/Pointer Events - use Pointer API for better stylus support
  const startDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!context) return;

      // Capture pointer for better tracking
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();

      const coords = getCoordinates(e.nativeEvent);
      if (!coords) return;

      isDrawingRef.current = true;
      setIsDrawing(true);
      currentStrokeRef.current = [coords];
      lastPointRef.current = coords;

      context.beginPath();
      context.moveTo(coords.x, coords.y);
      setupDrawingContext();
    },
    [context, getCoordinates, setupDrawingContext],
  );

  const draw = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !context) return;
      e.preventDefault();

      const coords = getCoordinates(e.nativeEvent);
      if (!coords) return;

      // Add point to current stroke
      currentStrokeRef.current.push(coords);
      lastPointRef.current = coords;

      // Schedule batched draw
      scheduleFlush();
    },
    [context, getCoordinates, scheduleFlush],
  );

  const stopDrawing = useCallback(
    (e?: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !context) return;

      // Release pointer capture
      if (e) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      // Flush any pending draws
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      flushDrawBuffer();

      isDrawingRef.current = false;
      setIsDrawing(false);
      context.closePath();
      context.globalAlpha = 1;

      currentStrokeRef.current = [];
      lastPointRef.current = null;

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
      flushDrawBuffer,
    ],
  );

  // Touch Events for multi-touch gestures (pinch-zoom, pan)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      // Two-finger touch = pan/zoom gesture
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsPanning(true);
        isDrawingRef.current = false;
        setIsDrawing(false);

        // Calculate initial distance for pinch zoom
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
      // Single touch drawing is handled by pointer events
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

        // Calculate new distance for zoom
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        if (lastTouchDistanceRef.current !== null) {
          const scaleChange = distance / lastTouchDistanceRef.current;
          setScale((prev) => Math.min(Math.max(prev * scaleChange, 0.5), 3));
        }
        lastTouchDistanceRef.current = distance;

        // Calculate pan
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
      // End pan/zoom gesture when fingers lifted
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
      style={{
        touchAction: "pan-x pan-y",
        overscrollBehavior: "contain",
      }}
    >
      {/* Zoom controls for touch devices */}
      <div className="fixed bottom-20 right-4 z-20 flex flex-col gap-2 md:hidden">
        <button
          onClick={() => setScale((prev) => Math.min(prev + 0.25, 3))}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold active:bg-gray-100"
          type="button"
        >
          +
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(prev - 0.25, 0.5))}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold active:bg-gray-100"
          type="button"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-xs font-medium active:bg-gray-100"
          type="button"
        >
          {Math.round(scale * 100)}%
        </button>
      </div>

      <div
        className="shadow-2xl bg-white rounded-sm origin-top"
        style={{
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          transition: isPanning ? "none" : "transform 0.1s ease-out",
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
          // Pointer Events (better for stylus/pen support)
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
          // Touch Events for multi-touch gestures only
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
