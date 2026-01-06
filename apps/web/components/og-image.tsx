import { ImageResponse } from "next/og";
import type { ImageResponseOptions } from "next/server";

export const contentType = "image/png";
export const dynamic = "force-static";
export const revalidate = false;

// Fetch fonts from Google Fonts
async function loadFonts() {
  const [inter, jetbrainsMono] = await Promise.all([
    fetch("https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff").then(
      (res) => res.arrayBuffer()
    ),
    fetch("https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjOVGa.woff").then(
      (res) => res.arrayBuffer()
    ),
  ]);
  return { inter, jetbrainsMono };
}

export async function generateOGImage(title: string) {
  const { inter, jetbrainsMono } = await loadFonts();

  const imageOptions: ImageResponseOptions = {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Inter",
        data: inter,
        weight: 700,
        style: "normal",
      },
      {
        name: "JetBrainsMono",
        data: jetbrainsMono,
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
            fontFamily: "JetBrainsMono",
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
