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
import { ChevronLeft, PanelLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "use-debounce";

export default function Page() {
  const { state, dispatch } = useNote();
  const { setSlug, slug } = useTools();
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

    // Set the slug in useTools to load the correct data
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

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-white">
        <div className="mx-auto">
          <div className="w-full gap-2 flex items-center py-4 px-4">
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
