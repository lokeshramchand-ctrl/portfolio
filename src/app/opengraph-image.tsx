import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        backgroundColor: "#000000",
        backgroundImage:
          "linear-gradient(#1c1c1c 1px, transparent 1px), linear-gradient(90deg, #1c1c1c 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 10,
            height: 10,
            background: "#e89a1c",
            borderRadius: 999,
          }}
        />
        <span style={{ fontSize: 24, color: "#e89a1c", letterSpacing: 2 }}>
          SOFTWARE ENGINEER
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#f5f5f0",
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          {siteConfig.name}
        </span>
        <span style={{ fontSize: 32, color: "#c4c4bd", marginTop: 28 }}>
          Software, engineered well.
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          color: "#8c8c86",
        }}
      >
        <span>{siteConfig.locationCountry}</span>
        <span>lokeshrc.me</span>
      </div>
    </div>,
    { ...size },
  );
}
