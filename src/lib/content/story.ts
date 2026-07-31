import fs from "node:fs";
import path from "node:path";

const STORY_DIR = path.join(process.cwd(), "docs", "story");

function readStoryFile(filename: string): string {
  return fs.readFileSync(path.join(STORY_DIR, filename), "utf-8");
}

export function loadAboutContent() {
  return {
    aboutV1: readStoryFile("ABOUT.md"),
    aboutV2: readStoryFile("ABOUT-v2.md"),
  };
}

export function loadMyStoryContent() {
  return {
    myStory: readStoryFile("MY-STORY.md"),
    whyThisExists: readStoryFile("WHY-THIS-EXISTS.md"),
    immunotherapy: readStoryFile("IMMUNOTHERAPY.md"),
    myAnswer: readStoryFile("MY-ANSWER.md"),
  };
}
