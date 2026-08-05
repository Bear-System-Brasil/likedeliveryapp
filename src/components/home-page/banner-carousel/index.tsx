"use client";

import Image from "next/image";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const banners = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1762424361024-66dc512c3872",
    title: "Frete Grátis",
    subtitle: "Pedidos acima de R$ 30",
    badge: "50% OFF",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1762417420647-45a4401b38f0",
    title: "Ofertas Especiais",
    subtitle: "Todos os dias da semana",
    badge: "NOVO",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1629123796793-5964e9b88646",
    title: "Desconto Progressivo",
    subtitle: "Quanto mais pede, mais economiza",
    badge: "30% OFF",
  },
];

export function BannerCarousel() {
  return (
    <section className="px-4 mt-6 mb-6">
      <div className="max-w-7xl mx-auto">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {banners.map((banner) => (
              <CarouselItem key={banner.id}>
                <div className="relative overflow-hidden rounded-3xl shadow-lg">
                  <div className="relative h-52 md:h-72">
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      priority={banner.id === 1}
                      className="object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

                    <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
                      <span className="mb-3 w-fit rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                        {banner.badge}
                      </span>

                      <h2 className="mb-2 text-2xl font-bold text-white md:text-4xl">
                        {banner.title}
                      </h2>

                      <p className="mb-5 text-sm text-white/90 md:text-base">
                        {banner.subtitle}
                      </p>

                      <button className="w-fit rounded-full bg-white px-6 py-2.5 font-semibold text-orange-500 transition-colors hover:bg-orange-50">
                        Pedir Agora
                      </button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
