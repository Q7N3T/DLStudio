import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Временная главная: настоящая собирается на этапе 4. */
export default function HomePage() {
  return (
    <section className="container-page py-16 lg:py-24">
      <p className="text-xs font-bold tracking-widest text-foreground-muted uppercase">
        Новая витрина · в разработке
      </p>
      <h1 className="mt-3 max-w-4xl font-display text-display font-bold break-words uppercase">
        Индивидуальность интереснее, чем тренды
      </h1>
      <p className="mt-5 max-w-xl text-foreground-muted">
        Одежда, обувь и аксессуары независимых студий из Китая — напрямую от производителей.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/catalog">Смотреть каталог</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/ui">Витрина компонентов</Link>
        </Button>
      </div>
    </section>
  );
}
