"use client";
type Props = {
  handleQuickAction: (actionLabel: string) => void;
};

export function RestaurantHero() {
  return (
    <section className="pt-20 sm:pt-24 md:pt-32 pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto px-2"></div>
        </div>
      </div>
    </section>
  );
}
