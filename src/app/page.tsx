import { MapView } from "@/components/MapView";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl px-6 pt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Allergy Locator
        </h1>
        <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Toggle an allergen to see its severity across 168 US cities.
        </p>
      </div>
      <MapView />
    </main>
  );
}
