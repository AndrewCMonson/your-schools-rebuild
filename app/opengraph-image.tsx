import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "#0f172a",
          color: "#e2e8f0",
          gap: 20,
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05 }}>
          YourSchools
        </div>
        <div style={{ fontSize: 34, fontWeight: 600, color: "#38bdf8" }}>
          Find the right school for your child
        </div>
        <div style={{ fontSize: 26, lineHeight: 1.3, maxWidth: 900, opacity: 0.95 }}>
          Search and compare early education schools by location, tuition, reviews, and verified claims.
        </div>
      </div>
    ),
    size,
  );
}

