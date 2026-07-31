export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Allergy Locator
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Pick your allergens. See where in the US you can actually breathe. The
        interactive map is under construction.
      </p>
    </main>
  );
}
