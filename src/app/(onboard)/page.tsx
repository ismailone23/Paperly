"use client";
import { IconFolderCode } from "@tabler/icons-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { uuid } from "@/lib/uuid";
import { FormEvent, ReactNode, useState } from "react";
import { useNote, NoteAction, Note } from "@/components/hooks/useNote";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Grid3x3,
  List,
  X,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Page() {
  const { state } = useNote();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPapers = state.notes.filter((note) =>
    note.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-stone-900 rounded flex items-center justify-center">
                <div className="w-4 h-4 border-4 border-stone-50 rounded" />
              </div>
              <h1 className="text-xl font-medium tracking-tight text-stone-900">
                ClassyFy
              </h1>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search papers..."
                  className="pl-10 pr-10 border-stone-300 focus:border-stone-900 focus:ring-stone-900"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {state.notes.length > 0 && (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    onClick={() => setViewMode("grid")}
                    variant={viewMode === "grid" ? "default" : "outline"}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode("list")}
                    variant={viewMode === "list" ? "default" : "outline"}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <NewPaper>
                <Button className="bg-stone-900 hover:bg-stone-800 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </Button>
              </NewPaper>
            </div>
          </div>
        </div>
      </nav>
      <div className="md:hidden border-b border-stone-200 bg-white">
        <div className="container mx-auto px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search papers..."
              className="pl-10 pr-10 border-stone-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        {state.notes.length > 0 ? (
          <LandingView
            state={filteredPapers}
            viewMode={viewMode}
            searchQuery={searchQuery}
            totalCount={state.notes.length}
          />
        ) : (
          <EmptyFiles />
        )}
      </main>
    </div>
  );
}

function DeleteNote({ note }: { note: Note }) {
  const { dispatch } = useNote();

  const handleDelete = () => {
    dispatch({
      type: NoteAction.DELETE,
      payload: note,
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Paper?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{note.name}&quot;? This action
            cannot be undone and all pages will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function LandingView({
  state,
  viewMode,
  searchQuery,
  totalCount,
}: {
  state: Note[];
  viewMode: "grid" | "list";
  searchQuery: string;
  totalCount: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium text-stone-900">
          {searchQuery ? "Search Results" : "Papers"}
        </h2>
        <p className="text-stone-600 mt-1">
          {searchQuery
            ? `${state.length} of ${totalCount} ${
                state.length === 1 ? "paper" : "papers"
              }`
            : `${totalCount} ${totalCount === 1 ? "paper" : "papers"}`}
        </p>
      </div>

      {state.length === 0 && searchQuery && (
        <div className="text-center py-16">
          <p className="text-stone-600">
            No papers found matching &quot;{searchQuery}&quot;
          </p>
        </div>
      )}

      {state.length > 0 && (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "flex flex-col gap-3"
          }
        >
          {!searchQuery && (
            <NewPaper>
              <div
                className={`group cursor-pointer border-2 border-dashed border-stone-300 hover:border-stone-500 rounded transition-colors ${
                  viewMode === "grid"
                    ? " flex items-center justify-center"
                    : "p-8 flex items-center justify-center"
                }`}
              >
                <div className="text-center">
                  <Plus className="w-8 h-8 text-stone-400 group-hover:text-stone-900 mx-auto mb-2 transition-colors" />
                  <p className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                    New Paper
                  </p>
                </div>
              </div>
            </NewPaper>
          )}

          {state.map((note, i) => (
            <div
              key={i}
              className={`group bg-white border border-stone-200 hover:border-stone-500 rounded transition-all relative ${
                viewMode === "list" ? "flex items-center" : ""
              }`}
            >
              <Link
                href={`/note/${note.slug}`}
                className={`flex-1 ${viewMode === "list" ? "flex items-center" : ""}`}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-video bg-stone-100 relative overflow-hidden">
                      {note.thumbnail ? (
                        <img
                          src={note.thumbnail}
                          alt={note.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,.02)_25%,rgba(0,0,0,.02)_50%,transparent_50%,transparent_75%,rgba(0,0,0,.02)_75%,rgba(0,0,0,.02))] bg-size-[20px_20px]" />
                      )}
                      <div className="absolute top-2 right-2 bg-white px-2 py-1 text-[10px] text-stone-600 border border-stone-200">
                        {new Date(note.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-stone-900 line-clamp-2">
                        {note.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-2">{note.slug}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 shrink-0 bg-stone-100 relative overflow-hidden">
                      {note.thumbnail ? (
                        <img
                          src={note.thumbnail}
                          alt={note.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,.02)_25%,rgba(0,0,0,.02)_50%,transparent_50%,transparent_75%,rgba(0,0,0,.02)_75%,rgba(0,0,0,.02))] bg-size-[20px_20px]" />
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <h3 className="font-medium text-stone-900">
                        {note.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">{note.slug}</p>
                    </div>
                    <div className="p-4 text-xs text-stone-500">
                      {new Date(note.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </>
                )}
              </Link>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white border border-stone-200"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DeleteNote note={note} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmptyFiles() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconFolderCode className="w-8 h-8 text-stone-900" />
          </EmptyMedia>
          <EmptyTitle className="text-xl font-medium">No Papers</EmptyTitle>
          <EmptyDescription className="text-stone-600 max-w-sm">
            Create your first paper to get started with ClassyFy
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-3">
            <NewPaper>
              <Button className="bg-stone-900 hover:bg-stone-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Paper
              </Button>
            </NewPaper>
            <Button variant="outline" className="border-stone-300">
              Import
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}

export function NewPaper({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState(uuid());
  const { dispatch, state } = useNote();
  const [error, setError] = useState<null | string>(null);

  const router = useRouter();
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    setError(null);
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { name, slug } = Object.fromEntries(formData.entries()) as {
      name: string;
      slug: string;
    };
    if (state.notes.find((pN) => pN.slug === slug)) {
      setError("The slug is already in use!");
      return;
    }
    try {
      dispatch({
        payload: { name, slug, thumbnail: null, timestamp: Date.now() },
        type: NoteAction.ADD,
      });
      router.push(`/note/${slug}`);
    } catch (error: unknown) {
      setError(error as string);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild onClick={() => setSlug(uuid())}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">New Paper</DialogTitle>
          <DialogDescription className="text-stone-600">
            Create a new paper with a name and slug
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 my-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={`Untitled ${state.notes.length + 1}`}
                autoFocus
                className="border-stone-300 focus:border-stone-900 focus:ring-stone-900"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug" className="text-sm font-medium">
                Slug
              </Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={slug}
                className="text-sm border-stone-300 focus:border-stone-900 focus:ring-stone-900"
              />
              <p className="text-xs text-stone-500">URL identifier</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                onClick={() => setError(null)}
                type="button"
                className="border-stone-300"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-stone-900 hover:bg-stone-800 text-white"
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
