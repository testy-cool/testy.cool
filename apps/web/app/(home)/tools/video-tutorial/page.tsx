import type { Metadata } from "next";
import TutorialApp from "@/components/tools/video-tutorial/TutorialApp";

export const metadata: Metadata = {
  title: "Video Tutorial Generator",
  description:
    "Turn any YouTube video into an interactive, scroll-synced text tutorial powered by AI.",
  openGraph: {
    title: "Video Tutorial Generator | testy.cool",
    description:
      "Turn any YouTube video into an interactive, scroll-synced text tutorial powered by AI.",
  },
};

export default function VideoTutorialPage() {
  return <TutorialApp />;
}
