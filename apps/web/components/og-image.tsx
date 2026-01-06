import { ImageResponse } from "next/og";
import type { ImageResponseOptions } from "next/server";

export const contentType = "image/png";
export const dynamic = "force-static";
export const revalidate = false;

const imageOptions: ImageResponseOptions = {
  width: 1200,
  height: 630,
};

export function generateOGImage(title: string) {
  return new ImageResponse(
    (
      <div
        tw="relative flex flex-col items-center justify-center w-full h-full"
        style={{
          backgroundColor: "#050505",
          padding: "80px",
        }}
      >
        {/* Purple glow spot */}
        <div
          tw="absolute"
          style={{
            width: "800px",
            height: "800px",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(124, 58, 237, 0) 60%)",
            borderRadius: "50%",
            filter: "blur(80px)",
          }}
        />

        {/* Grid background */}
        <div
          tw="absolute inset-0"
          style={{
            opacity: 0.15,
            backgroundImage:
              "linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(circle at center, black 40%, transparent 100%)",
          }}
        />

        {/* Content */}
        <div tw="relative flex flex-col items-center" style={{ gap: "40px", maxWidth: "950px" }}>
          {/* Logo with halo */}
          <div
            tw="relative flex items-center justify-center"
            style={{ width: "120px", height: "120px" }}
          >
            <div
              tw="absolute"
              style={{
                width: "160px",
                height: "160px",
                background:
                  "radial-gradient(closest-side, rgba(167, 139, 250, 0.6) 0%, rgba(124, 58, 237, 0) 100%)",
                borderRadius: "50%",
                filter: "blur(30px)",
              }}
            />
            <img
              src="https://testy.cool/favicon-96x96.png"
              alt="Logo"
              width={96}
              height={96}
              tw="relative"
            />
          </div>

          {/* Title */}
          <div
            tw="text-white text-center"
            style={{
              fontSize: "72px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer */}
        <div
          tw="absolute"
          style={{
            bottom: "40px",
            fontSize: "18px",
            color: "#888",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Testy.Cool
        </div>
      </div>
    ),
    imageOptions
  );
}
