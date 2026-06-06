"use client";

import LightPillar from "./LightPillar";

export default function LoginTemporal() {
  return (
    <div className="absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(59,130,246,0.2),rgba(15,23,42,0.94))]" />
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <LightPillar
          topColor="#2563eb"
          bottomColor="#67e8f9"
          intensity={0.7}
          rotationSpeed={0.6}
          glowAmount={0.002}
          pillarWidth={3}
          pillarHeight={0.4}
          noiseIntensity={0.5}
          pillarRotation={37}
          interactive={false}
          mixBlendMode="screen"
          quality="high"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(15,23,42,0.05),rgba(2,6,23,0.8))]" />
    </div>
  );
}
