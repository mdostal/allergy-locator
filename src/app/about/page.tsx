import { AboutTabs } from "@/components/about/AboutTabs";
import { loadAboutContent, loadMyStoryContent } from "@/lib/content/story";

export const metadata = {
  title: "About — Allergy Locator",
};

export default function AboutPage() {
  const { aboutV1, aboutV2 } = loadAboutContent();
  const { myStory, whyThisExists, immunotherapy, myAnswer } = loadMyStoryContent();

  return (
    <AboutTabs
      aboutV1={aboutV1}
      aboutV2={aboutV2}
      myStory={myStory}
      whyThisExists={whyThisExists}
      immunotherapy={immunotherapy}
      myAnswer={myAnswer}
    />
  );
}
