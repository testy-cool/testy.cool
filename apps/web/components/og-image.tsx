import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const dynamic = "force-static";
export const revalidate = false;

export async function generateOGImage(title: string) {
  // Load Inter from Google Fonts - using the correct API endpoint
  const interFont = await fetch(
    "https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap"
  ).then((res) => res.text())
    .then((css) => {
      // Extract the font URL from the CSS
      const match = css.match(/src: url\(([^)]+)\)/);
      if (match) return fetch(match[1]).then((res) => res.arrayBuffer());
      return null;
    });

  const sourceCodeFont = await fetch(
    "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@500&display=swap"
  ).then((res) => res.text())
    .then((css) => {
      const match = css.match(/src: url\(([^)]+)\)/);
      if (match) return fetch(match[1]).then((res) => res.arrayBuffer());
      return null;
    });

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
            fontFamily: "SourceCodePro",
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
    {
      width: 1200,
      height: 630,
      fonts: [
        ...(interFont ? [{
          name: "Inter",
          data: interFont,
          weight: 700 as const,
          style: "normal" as const,
        }] : []),
        ...(sourceCodeFont ? [{
          name: "SourceCodePro",
          data: sourceCodeFont,
          weight: 500 as const,
          style: "normal" as const,
        }] : []),
      ],
    }
  );
}
