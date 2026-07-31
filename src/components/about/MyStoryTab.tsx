import { MarkdownContent } from "@/components/about/MarkdownContent";

interface Props {
  myStory: string;
  whyThisExists: string;
  immunotherapy: string;
  myAnswer: string;
}

export function MyStoryTab({
  myStory,
  whyThisExists,
  immunotherapy,
  myAnswer,
}: Props) {
  return (
    <div className="flex flex-col gap-10">
      <MarkdownContent content={whyThisExists} />
      <hr className="border-zinc-200 dark:border-zinc-800" />
      <MarkdownContent content={myStory} />
      <hr className="border-zinc-200 dark:border-zinc-800" />
      <MarkdownContent content={immunotherapy} />
      <hr className="border-zinc-200 dark:border-zinc-800" />
      <MarkdownContent content={myAnswer} />
    </div>
  );
}
