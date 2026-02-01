"use client";
import {
  Note,
  NoteAction,
  ToolAction,
  useNote,
} from "@/components/hooks/useNote";
import { useTools } from "@/components/hooks/useTools";
import PaperCanvas from "@/components/paper-canvas";
import PensPlates from "@/components/pens-plates";
import PagesSidebar from "@/components/pages-sidebar";
import { ChevronLeft, PanelLeft, Download } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "use-debounce";
import { exportToPDF } from "@/lib/exportPDF";

export default function Page() {
  const { state, dispatch } = useNote();
  const { setSlug, slug, pages, pageCount, getPageData } = useTools();
  const { noteId } = useParams<{ noteId: string }>();
  const router = useRouter();
  const canvasRef = useRef<any>(null);
  const [title, setTitle] = useState("");
  const [value] = useDebounce(title, 1000);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const noteRef = useRef<any>(null);

  useEffect(() => {
    if (!noteId) {
      router.push("/note-found");
      return;
    }
    const note = state.notes.find((n) => n.slug === noteId);
    if (!note) {
      router.push("/note-found");
      return;
    }
    noteRef.current = note;
    setTitle(note.name);

    setSlug(noteId);
  }, [noteId, state, router, setSlug]);

  useEffect(() => {
    if (value && noteRef.current && value !== noteRef.current.name) {
      dispatch({
        type: NoteAction.UPDATE,
        payload: { ...noteRef.current, name: value },
      });
    }
  }, [value, dispatch]);

  // Generate and save thumbnail periodically
  useEffect(() => {
    if (!slug || !noteRef.current) return;

    const generateThumbnail = () => {
      const pageData = getPageData(1); // Use first page as thumbnail
      if (!pageData) return;

      const canvas = document.createElement("canvas");
      const pixelRatio = window.devicePixelRatio || 1;
      const CANVAS_WIDTH = 794 * pixelRatio;
      const CANVAS_HEIGHT = 1123 * pixelRatio;
      const THUMB_WIDTH = 400;
      const THUMB_HEIGHT = Math.round((1123 / 794) * THUMB_WIDTH);

      canvas.width = THUMB_WIDTH;
      canvas.height = THUMB_HEIGHT;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = CANVAS_WIDTH;
        tempCanvas.height = CANVAS_HEIGHT;
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx) {
          tempCtx.putImageData(pageData, 0, 0);
          ctx.drawImage(
            tempCanvas,
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
            0,
            0,
            THUMB_WIDTH,
            THUMB_HEIGHT,
          );

          const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8);

          // Update note with thumbnail
          dispatch({
            type: NoteAction.UPDATE,
            payload: {
              ...noteRef.current,
              thumbnail: thumbnailDataUrl,
            },
          });
        }
      }
    };

    // Generate thumbnail every 5 seconds
    const interval = setInterval(generateThumbnail, 5000);

    // Generate immediately on mount
    generateThumbnail();

    return () => clearInterval(interval);
  }, [slug, getPageData, dispatch]);

  const handleExportPDF = async () => {
    if (!slug) return;

    const fileName = title || "document";

    try {
      canvasRef.current?.saveCurrentPageData();

      await exportToPDF({
        pages,
        pageCount,
        fileName,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-white">
        <div className="mx-auto">
          <div className="w-full gap-2 flex items-center justify-between py-4 px-4">
            <div className="flex items-center gap-2 flex-1">
              <Link className="hover:bg-gray-50 p-2 rounded" href={"/"}>
                <ChevronLeft className="w-5 text-black h-5" />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2"
              >
                <PanelLeft className="w-5 h-5" />
              </Button>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                className="bg-white shadow-none border-none max-w-sm"
                placeholder="Untitled"
              />
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleExportPDF}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <PagesSidebar
          onPageChange={(page) => canvasRef.current?.handlePageChange(page)}
          canvasRef={canvasRef}
          isOpen={isSidebarOpen}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 bg-white border-b">
            <PensPlates
              onPageChange={(page) => canvasRef.current?.handlePageChange(page)}
              onClearPage={() => canvasRef.current?.clearPage()}
            />
          </div>
          <div className="flex-1 overflow-auto">
            <PaperCanvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
