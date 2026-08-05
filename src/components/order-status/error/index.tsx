import { MainHeader } from "@/components/main-header";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  data: {
    totalItems: number;
    error: string | null;
  };
};

export function ErrorPage({ data }: Props) {
  const router = useRouter();

  return (
    <AnimatedBackground showBlobs={true} blobCount={2}>
      <MainHeader
        cartItems={data.totalItems}
        onCartClick={() => router.push("/cart")}
        showSearch={false}
        showNav={true}
      />
      <div className="min-h-screen flex items-center justify-center pt-32">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">
            {data.error || "Pedido não encontrado"}
          </p>
          <Button
            onClick={() => router.push("/restaurants")}
            className="bg-linear-to-r from-orange-500 to-orange-500 hover:from-orange-600 hover:to-orange-600 cursor-pointer"
          >
            Voltar para Restaurantes
          </Button>
        </div>
      </div>
    </AnimatedBackground>
  );
}
