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

export default function Page() {
  return <RecentActivity />;
}

export function NewPaper() {
  const [slug, setSlug] = useState(uuid());

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    console.log(Object.fromEntries(formData.entries()));
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
              <Input id="name" name="name" defaultValue="Untitled" autoFocus />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={slug} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
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
