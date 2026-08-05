import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: ReactNode;
  showBackButton?: boolean;
  backUrl?: string;
}

/**
 * Consistent page header component
 */
export function PageHeader({
  title,
  description,
  badge,
  actions,
  showBackButton = false,
  backUrl,
}: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && <BackButton href={backUrl} />}

            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {description && <p className="text-gray-600">{description}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {badge && (
              <Badge
                variant={badge.variant || "default"}
                className="bg-linear-to-br from-orange-100 to-orange-100 text-orange-700 border-0"
              >
                {badge.text}
              </Badge>
            )}
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
}
