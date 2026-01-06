import { ImageResponse } from "next/og";
import type { ImageResponseOptions } from "next/server";

export const contentType = "image/png";
export const dynamic = "force-static";
export const revalidate = false;

// Fetch fonts
async function loadFonts() {
  const [interBold, firaCode] = await Promise.all([
    fetch("https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.otf").then(
      (res) => res.arrayBuffer()
    ),
    fetch("https://github.com/tonsky/FiraCode/raw/master/distr/otf/FiraCode-Medium.otf").then(
      (res) => res.arrayBuffer()
    ),
  ]);
  return { interBold, firaCode };
}

export async function generateOGImage(title: string) {
  const { interBold, firaCode } = await loadFonts();

  const imageOptions: ImageResponseOptions = {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Inter",
        data: interBold,
        weight: 700,
        style: "normal",
      },
      {
        name: "FiraCode",
        data: firaCode,
        weight: 500,
        style: "normal",
      },
    ],
  };

  return new ImageResponse(
    (
      <div
        tw="relative flex flex-col items-center justify-center w-full h-full"
        style={{
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, #1a0a2e 0%, #050505 70%)",
        }}
      >
        {/* Grid background */}
        <div
          tw="absolute inset-0"
          style={{
            opacity: 0.12,
            backgroundImage:
              "linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div tw="flex flex-col items-center" style={{ gap: "32px", maxWidth: "950px", padding: "80px" }}>
          {/* Logo */}
          <img
            src="https://testy.cool/favicon-96x96.png"
            alt="Logo"
            width={80}
            height={80}
          />

          {/* Title */}
          <div
            tw="text-white text-center"
            style={{
              fontFamily: "Inter",
              fontSize: "64px",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer */}
        <div
          tw="absolute flex"
          style={{
            fontFamily: "FiraCode",
            bottom: "40px",
            fontSize: "14px",
            color: "#666",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          testy.cool
        </div>
      </div>
    ),
    imageOptions
  );
}
