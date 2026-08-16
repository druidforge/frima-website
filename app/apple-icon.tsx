import { ImageResponse } from "next/og";

import { markDataUri } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon. Needs an opaque ground - iOS does not honour alpha. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#16131d",
      }}
    >
      {/* Satori renders plain <img> only; next/image does not exist here. */}
      <img src={markDataUri} width={136} height={136} alt="" />
    </div>,
    size,
  );
}
