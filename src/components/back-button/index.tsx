"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  onClick?: () => void;
  href?: string;
  className?: string;
  sticky?: boolean;
}

export function BackButton({
  onClick,
  href,
  className = "",
  sticky = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center",
        "border-2 border-gray-200 bg-white shadow-sm hover:shadow-md",
        "transition-all cursor-pointer",
        "hover:border-orange-300 hover:bg-linear-to-br hover:from-orange-50 hover:to-orange-50",
        sticky && "fixed top-24 left-4 z-50",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
