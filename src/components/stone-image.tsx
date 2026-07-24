"use client";
import { useState } from "react";

// Shows a stone's photo via the same-origin proxy (/api/media/<ref>/image), falling
// back to the grey ◆ gem placeholder when there's no photo or the image fails to load.
export function StoneImage({ stoneRef, hasPhoto, iconSize = 40 }: { stoneRef: string; hasPhoto: boolean; iconSize?: number }) {
  const [failed, setFailed] = useState(false);

  if (!hasPhoto || failed) {
    return (
      <div className="gembox" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
        <span style={{ fontSize: iconSize, color: "#cfc7bf" }}>◆</span>
      </div>
    );
  }
  return (
    <img
      src={`/api/media/${encodeURIComponent(stoneRef)}/image`}
      alt="Diamond"
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
