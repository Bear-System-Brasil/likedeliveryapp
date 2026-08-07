import { ThumbsUp } from "lucide-react";
import Link from "next/link";

type LikeDeliveryLogoProps = {
  children?: React.ReactNode;
};

export function LikeDeliveryLogo({ children }: LikeDeliveryLogoProps) {
  return (
    <Link href={"/"}>
      <div className="flex items-center space-x-2 cursor-pointer">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-linear-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
          <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <h1 className="text-sm xs:text-base sm:text-xl font-bold text-gray-900">
          {children}
        </h1>
      </div>
    </Link>
  );
}
