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
import { FormEvent, useState } from "react";
import useLocal, { NoteAction } from "@/components/hooks/useLocal";
import { useRouter } from "next/navigation";

export default function Page() {
  return <RecentActivity />;
}

export function NewPaper() {
  const [slug, setSlug] = useState(uuid());
  const { dispatch, state } = useLocal();
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
    if (state.find((pN) => pN.slug === slug)) {
      setError("The slug is already in use!");
      return;
    }
    try {
      dispatch({
        payload: { name, slug, thumbnail: null, timestamp: new Date() },
        type: NoteAction.ADD,
      });
      router.push(`/note/${slug}`);
    } catch (error: any) {
      setError(error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild onClick={() => setSlug(uuid())}>
        <Button>Create Paper</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>New Paper</DialogTitle>
          <DialogDescription>
            Describe what the would be the name and slug of the paper
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-5">
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={`Untitled ${state.length + 1}`}
                autoFocus
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={slug} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setError(null)}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
          {error && (
            <p className="text-red-600 bg-red-200 px-4 my-2 py-2 rounded-md">
              {error}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecentActivity() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Paper Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any papers yet. Get started by creating your
          first paper.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <NewPaper />
          <Button variant="outline">Import Paper</Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
