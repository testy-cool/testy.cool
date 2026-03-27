import type { Metadata } from "next";
import TutorialApp from "@/components/tools/video-breakdown/TutorialApp";

const description =
  "Paste a YouTube URL. AI watches the video and writes a scroll-synced text breakdown.";

export const metadata: Metadata = {
  title: "Video Breakdown",
  description,
  openGraph: {
    title: "Video Breakdown | testy.cool",
    description,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Video Breakdown",
  description,
  url: "https://testy.cool/tools/video-breakdown",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0" },
};

export default function VideoBreakdownPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TutorialApp />
    </>
  );
}
