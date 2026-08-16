import Image from "next/image";
import { GALLERY } from "@/data/content";

export function Portfolio() {
  return (
    <section id="gallery" className="section-pad bg-[var(--paper)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Галерея</p>
          <h2 className="section-title">Архитектурные решения</h2>
          <p className="section-lead">
            Подборка визуальных референсов для демонстрации атмосферы проекта.
            Это не каталог реально сданных объектов конкретной компании.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {GALLERY.map((item, index) => (
            <figure
              key={item.id}
              className={`relative overflow-hidden rounded-3xl ${
                index === 0
                  ? "min-h-[280px] sm:col-span-2 sm:row-span-2 sm:min-h-[420px]"
                  : "min-h-[220px]"
              }`}
            >
              <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                fill
                sizes={
                  index === 0
                    ? "(max-width: 640px) 100vw, 50vw"
                    : "(max-width: 1024px) 50vw, 25vw"
                }
                className="motion-safe-zoom object-cover transition duration-700 hover:scale-[1.04]"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(20,24,22,0.75)] to-transparent px-4 pb-4 pt-10 text-sm text-[var(--paper)]">
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
