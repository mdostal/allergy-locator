import Link from "next/link";
import { CareAccessView } from "@/components/CareAccessView";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Care access — Allergy Locator",
};

export default function CareAccessPage() {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <div className="mx-auto flex w-full max-w-6xl items-start justify-between px-6 pt-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Care access
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Nearest hospital access across 168 US cities — general, pediatric specialty, and
            pediatric cardiac surgery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            Allergy map
          </Link>
        </div>
      </div>
      <CareAccessView />
    </main>
  );
}
