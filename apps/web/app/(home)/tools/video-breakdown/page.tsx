import type { Metadata } from "next";
import TutorialApp from "@/components/tools/video-breakdown/TutorialApp";

export const metadata: Metadata = {
  title: "Video Breakdown",
  description:
    "Paste a YouTube URL. AI watches the video and writes a scroll-synced text breakdown.",
  openGraph: {
    title: "Video Breakdown | testy.cool",
    description:
      "Paste a YouTube URL. AI watches the video and writes a scroll-synced text breakdown.",
  },
};

export default function VideoBreakdownPage() {
  return <TutorialApp />;
}
