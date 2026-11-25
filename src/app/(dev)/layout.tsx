import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SiteHeader } from "@/components/layout/site-header";

/** Служебные страницы: та же шапка и таб-бар, чтобы видеть компоненты в контексте. */
export default function DevLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1 pb-tabbar">
        {children}
      </main>
      <MobileTabBar />
    </>
  );
}
