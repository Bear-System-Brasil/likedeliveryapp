import { CheckCircle2, Info, XCircle } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

interface LoadingStateProps {
  text?: string;
}

/**
 * Empty state component
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-gray-400 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );
}

/**
 * Error state component with different variants
 */
export function ErrorState({
  title = "Ops! Algo deu errado",
  message,
  retry,
}: ErrorStateProps) {
  return (
    <div className="my-4 p-4 border border-red-200 bg-red-50 rounded-lg">
      <div className="flex items-start">
        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
        <div className="ml-3">
          <h4 className="font-medium text-red-800">{title}</h4>
          <p className="mt-1 text-red-700">{message}</p>
          {retry && (
            <button
              onClick={retry}
              className="mt-2 text-sm text-red-600 underline hover:no-underline cursor-pointer"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Success state component
 */
export function SuccessState({ message }: { message: string }) {
  return (
    <div className="my-4 p-4 border border-green-200 bg-green-50 rounded-lg">
      <div className="flex items-center">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <p className="ml-3 text-green-800">{message}</p>
      </div>
    </div>
  );
}

/**
 * Info state component
 */
export function InfoState({ message }: { message: string }) {
  return (
    <div className="my-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
      <div className="flex items-center">
        <Info className="h-5 w-5 text-blue-600" />
        <p className="ml-3 text-blue-800">{message}</p>
      </div>
    </div>
  );
}

/**
 * Loading state component
 */
export function LoadingState({ text = "Carregando..." }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-16 sm:py-20">
      <div className="relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 blur-2xl opacity-30">
          <div className="w-32 h-32 bg-gradient-to-r from-orange-400 to-orange-400 rounded-full animate-pulse"></div>
        </div>

        {/* Main loading content */}
        <div className="relative flex flex-col items-center space-y-4">
          {/* Spinner with gradient border effect */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-500 animate-spin"></div>
          </div>

          {/* Loading text */}
          <div className="flex flex-col items-center space-y-1">
            <span className="text-gray-900 font-medium text-base sm:text-lg">
              {text}
            </span>
            <div className="flex space-x-1">
              <span
                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
