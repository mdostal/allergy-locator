import Link from "next/link";
import { AboutTabs } from "@/components/about/AboutTabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loadAboutContent, loadMyStoryContent } from "@/lib/content/story";

export const metadata = {
  title: "About — Allergy Locator",
};

export default function AboutPage() {
  const { aboutV1, aboutV2 } = loadAboutContent();
  const { myStory, whyThisExists, immunotherapy, myAnswer } = loadMyStoryContent();

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-6">
        <Link
          href="/"
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Map
        </Link>
        <ThemeToggle />
      </div>
      <AboutTabs
        aboutV1={aboutV1}
        aboutV2={aboutV2}
        myStory={myStory}
        whyThisExists={whyThisExists}
        immunotherapy={immunotherapy}
        myAnswer={myAnswer}
      />
    </>
  );
}
