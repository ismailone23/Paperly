"use client";
import { useNote } from "@/components/hooks/useNote";
import PensPlates from "@/components/pens-plates";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef } from "react";

export default function Page() {
  const { state } = useNote();
  const { noteId } = useParams<{ noteId: string }>();
  const router = useRouter();

  const note = useMemo(() => {
    if (!noteId) return null;
    return state.find((n) => n.slug === noteId) || null;
  }, [noteId, state]);

  useEffect(() => {
    if (!noteId || !note) {
      router.push("/not-found");
    }
  }, [noteId, note, router]);

  return (
    <div className="container mx-auto">
      <div className="w-full gap-4 flex items-start mt-5">
        <Link className="hover:bg-gray-50 p-1 rounded" href={"/"}>
          <ChevronLeft className="w-5 text-black h-5" />
        </Link>
        <h1 className="font-medium">{note?.name}</h1>
      </div>
      <div className="p-2">
        <PensPlates />
      </div>
    </div>
  );
}
