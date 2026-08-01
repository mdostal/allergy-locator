"use client";

import { useState } from "react";
import { MyStoryTab } from "@/components/about/MyStoryTab";
import { ProjectTab } from "@/components/about/ProjectTab";
import { MarkdownContent } from "@/components/about/MarkdownContent";
import { ByoKeySettings } from "@/components/ByoKeySettings";

interface Props {
  aboutV1: string;
  aboutV2: string;
  methodology: string;
  myStory: string;
  whyThisExists: string;
  immunotherapy: string;
  myAnswer: string;
}

type TabId = "my-story" | "project" | "methodology";
type LayoutVariant = "a" | "b";

const TABS: { id: TabId; label: string }[] = [
  { id: "my-story", label: "My Story" },
  { id: "project", label: "The Project" },
  { id: "methodology", label: "Methodology" },
];

/**
 * Two layout variants, live-switchable, per the round-1 request for a /design
 * A/B comparison: "A" is a conventional top tab bar; "B" mirrors the main map
 * page's sidebar+content pattern for visual consistency with the rest of the app.
 */
export function AboutTabs(props: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("project");
  const [layout, setLayout] = useState<LayoutVariant>("a");

  const content =
    activeTab === "project" ? (
      <ProjectTab aboutV1={props.aboutV1} aboutV2={props.aboutV2} />
    ) : activeTab === "methodology" ? (
      <div className="flex flex-col gap-6">
        <MarkdownContent content={props.methodology} />
        <ByoKeySettings />
      </div>
    ) : (
      <MyStoryTab
        myStory={props.myStory}
        whyThisExists={props.whyThisExists}
        immunotherapy={props.immunotherapy}
        myAnswer={props.myAnswer}
      />
    );

  const layoutToggle = (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <span>Layout:</span>
      <button
        type="button"
        onClick={() => setLayout("a")}
        className={layout === "a" ? "font-semibold text-zinc-700 dark:text-zinc-200" : "underline"}
      >
        A
      </button>
      <button
        type="button"
        onClick={() => setLayout("b")}
        className={layout === "b" ? "font-semibold text-zinc-700 dark:text-zinc-200" : "underline"}
      >
        B
      </button>
    </div>
  );

  if (layout === "b") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 md:flex-row">
        <div className="flex flex-col gap-4 md:w-48 md:flex-shrink-0">
          <nav className="flex flex-col gap-1" aria-label="About sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id}
                className={`rounded-md px-3 py-2 text-left text-sm font-medium ${
                  activeTab === tab.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          {layoutToggle}
        </div>
        <div className="flex-1">{content}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex gap-6" aria-label="About sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id}
              className={`border-b-2 px-1 pb-3 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {layoutToggle}
      </div>
      {content}
    </div>
  );
}
