"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTools } from "./hooks/useTools";
import { Button } from "./ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { ToolAction, useNote } from "./hooks/useNote";

interface PagesSidebarProps {
  onPageChange: (page: number) => void;
  canvasRef: React.RefObject<any>;
  isOpen: boolean;
}

export default function PagesSidebar({
  onPageChange,
  canvasRef,
  isOpen,
}: PagesSidebarProps) {
  const {
    currentPage,
    pageCount,
    setPageCount,
    setCurrentPage,
    getPageData,
    savePageData,
    historyStep,
    reorderPages,
    slug,
  } = useTools();

  const { dispatch } = useNote();
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [draggedPage, setDraggedPage] = useState<number | null>(null);
  const [dragOverPage, setDragOverPage] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const THUMBNAIL_WIDTH = 140;
  const THUMBNAIL_HEIGHT = Math.round((A4_HEIGHT / A4_WIDTH) * THUMBNAIL_WIDTH);

  useEffect(() => {
    const currentPageElement = pageRefs.current.get(currentPage);
    if (currentPageElement && scrollAreaRef.current) {
      currentPageElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentPage]);

  const generateThumbnail = useCallback(
    (pageNumber: number): string => {
      const pageData = getPageData(pageNumber);

      if (!pageData) {
        const canvas = document.createElement("canvas");
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = THUMBNAIL_HEIGHT;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
          ctx.strokeStyle = "#e5e7eb";
          ctx.strokeRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
        }

        return canvas.toDataURL();
      }

      const canvas = document.createElement("canvas");
      canvas.width = THUMBNAIL_WIDTH;
      canvas.height = THUMBNAIL_HEIGHT;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = A4_WIDTH;
        tempCanvas.height = A4_HEIGHT;
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx) {
          tempCtx.putImageData(pageData, 0, 0);
          ctx.drawImage(
            tempCanvas,
            0,
            0,
            A4_WIDTH,
            A4_HEIGHT,
            0,
            0,
            THUMBNAIL_WIDTH,
            THUMBNAIL_HEIGHT,
          );
        }
      }

      return canvas.toDataURL();
    },
    [getPageData, A4_WIDTH, A4_HEIGHT, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT],
  );

  useEffect(() => {
    const thumbnail = generateThumbnail(currentPage);
    setThumbnails((prev) => new Map(prev.set(currentPage, thumbnail)));
  }, [historyStep, currentPage, generateThumbnail]);

  useEffect(() => {
    const newThumbnails = new Map<number, string>();
    for (let i = 1; i <= pageCount; i++) {
      newThumbnails.set(i, generateThumbnail(i));
    }
    setThumbnails(newThumbnails);
  }, [pageCount, refreshTrigger, generateThumbnail]);

  const refreshAllThumbnails = () => {
    // Save current page before refreshing
    canvasRef.current?.saveCurrentPageData();
    setRefreshTrigger((prev) => prev + 1);
  };

  const addNewPage = () => {
    const newPageCount = pageCount + 1;
    setPageCount(newPageCount);

    // Update tool metadata in note context
    if (slug) {
      dispatch({
        type: ToolAction.UPDATE,
        payload: {
          slug,
          pageCount: newPageCount,
        },
      });
    }
  };

  const deletePage = (pageNumber: number) => {
    if (pageCount === 1) return;

    // Create new pages map without the deleted page
    const newPages = new Map<number, ImageData>();
    let newPageNum = 1;

    for (let i = 1; i <= pageCount; i++) {
      if (i !== pageNumber) {
        const pageData = getPageData(i);
        if (pageData) {
          newPages.set(newPageNum, pageData);
        }
        newPageNum++;
      }
    }

    // Update all pages
    newPages.forEach((data, num) => {
      savePageData(num, data);
    });

    // Update page count
    const newPageCount = pageCount - 1;
    setPageCount(newPageCount);

    // Update current page if necessary
    if (currentPage === pageNumber) {
      const newCurrent = Math.min(currentPage, newPageCount);
      setCurrentPage(newCurrent);
      onPageChange(newCurrent);
    } else if (currentPage > pageNumber) {
      setCurrentPage(currentPage - 1);
    }

    // Update tool metadata in note context
    if (slug) {
      dispatch({
        type: ToolAction.UPDATE,
        payload: {
          slug,
          pageCount: newPageCount,
        },
      });
    }

    // Refresh thumbnails
    setTimeout(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 100);
  };

  const handleDragStart = (e: React.DragEvent, pageNumber: number) => {
    setDraggedPage(pageNumber);
    e.dataTransfer.effectAllowed = "move";
    (e.target as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedPage(null);
    setDragOverPage(null);
  };

  const handleDragOver = (e: React.DragEvent, pageNumber: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (draggedPage !== pageNumber) {
      setDragOverPage(pageNumber);
    }
  };

  const handleDragLeave = () => {
    setDragOverPage(null);
  };

  const handleDrop = (e: React.DragEvent, targetPage: number) => {
    e.preventDefault();

    if (draggedPage === null || draggedPage === targetPage) {
      setDragOverPage(null);
      return;
    }

    if (reorderPages) {
      reorderPages(draggedPage, targetPage);
      // Refresh thumbnails after reordering
      setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1);
      }, 100);
    }

    setDraggedPage(null);
    setDragOverPage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Pages</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={refreshAllThumbnails}
              title="Refresh thumbnails"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={addNewPage}
              title="Add new page"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </p>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
        <div className="space-y-3">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNum, el);
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, pageNum)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, pageNum)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, pageNum)}
              className={`group relative rounded-lg overflow-hidden transition-all cursor-move ${
                currentPage === pageNum
                  ? "ring-2 ring-blue-500 shadow-lg"
                  : "hover:ring-2 hover:ring-gray-300"
              } ${
                dragOverPage === pageNum && draggedPage !== pageNum
                  ? "ring-2 ring-green-500 scale-105"
                  : ""
              } ${draggedPage === pageNum ? "opacity-50" : ""}`}
            >
              <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded shadow-lg cursor-grab active:cursor-grabbing">
                <GripVertical className="w-3 h-3 text-gray-600" />
              </div>

              <button
                onClick={() => onPageChange(pageNum)}
                className="w-full relative block"
              >
                <div className="relative bg-white">
                  {thumbnails.get(pageNum) && (
                    <img
                      src={thumbnails.get(pageNum)}
                      alt={`Page ${pageNum}`}
                      className="w-full h-auto object-cover border border-gray-200"
                      style={{
                        width: THUMBNAIL_WIDTH,
                        height: THUMBNAIL_HEIGHT,
                      }}
                    />
                  )}

                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                    {pageNum}
                  </div>

                  {currentPage === pageNum && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded font-medium shadow-lg">
                      Current
                    </div>
                  )}

                  {dragOverPage === pageNum && draggedPage !== pageNum && (
                    <div className="absolute inset-0 bg-green-500/20 border-2 border-green-500 rounded flex items-center justify-center">
                      <span className="text-green-700 font-semibold text-sm bg-white px-3 py-1 rounded shadow">
                        Drop here
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>

                <div
                  className={`text-xs text-center py-2 transition-colors ${
                    currentPage === pageNum
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "bg-white text-gray-600 group-hover:bg-gray-50"
                  }`}
                >
                  Page {pageNum}
                </div>
              </button>

              {pageCount > 1 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-1.5 rounded shadow-lg z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Page?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete page {pageNum}? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deletePage(pageNum)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          Viewing page {currentPage} of {pageCount}
        </div>
      </div>
    </div>
  );
}
