"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MobileSearchTriggerProps {
  className?: string;
}

export function MobileSearchTrigger({ className }: MobileSearchTriggerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/restaurants?search=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className={clsx("flex items-center justify-end", className)}
    >
      <div
        className={clsx(
          "overflow-hidden transition-all duration-200 ease-out",
          open ? "mr-2 w-[calc(100%-48px)] opacity-100" : "w-0 opacity-0",
        )}
      >
        <Input
          ref={inputRef}
          placeholder="Buscar restaurante..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="h-10 rounded-xl border-0 bg-white shadow-sm"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-xl border-0 bg-white shadow-sm"
        onClick={() => {
          if (!open) {
            setOpen(true);
            return;
          }
          if (query.trim()) {
            handleSubmit();
            return;
          }
          setOpen(false);
        }}
        aria-label={
          !open ? "Buscar" : query.trim() ? "Buscar restaurante" : "Fechar busca"
        }
      >
        {open && !query.trim() ? (
          <X className="h-4 w-4" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
