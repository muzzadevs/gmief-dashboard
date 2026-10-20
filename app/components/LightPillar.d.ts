import type { CSSProperties } from "react";

interface LightPillarProps {
  topColor?: string;
  bottomColor?: string;
  intensity?: number;
  rotationSpeed?: number;
  flow?: number;
  interactive?: boolean;
  clickPulse?: boolean;
  glowAmount?: number;
  bloom?: number;
  pillarWidth?: number;
  pillarHeight?: number;
  pillarRotation?: number;
  twist?: number;
  detail?: number;
  noiseIntensity?: number;
  fade?: number;
  intro?: boolean;
  mixBlendMode?: CSSProperties["mixBlendMode"];
  quality?: "low" | "medium" | "high";
  resolution?: number;
  lightMode?: boolean;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function LightPillar(props: LightPillarProps): JSX.Element;
