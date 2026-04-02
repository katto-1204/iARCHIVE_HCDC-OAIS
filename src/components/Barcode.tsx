import * as React from "react";
import { generateBarcodeBars } from "@/data/metadataUtils";

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Barcode({ value, width = 120, height = 32, className = "" }: BarcodeProps) {
  const bars = React.useMemo(() => generateBarcodeBars(value), [value]);
  const totalWidth = bars.reduce((a, b) => a + b, 0);
  const scale = width / totalWidth;

  return (
    <div className={`inline-flex flex-col items-center gap-0.5 ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        {(() => {
          let x = 0;
          return bars.map((barWidth, i) => {
            const w = barWidth * scale;
            const isBar = i % 2 === 0;
            const rect = isBar ? (
              <rect key={i} x={x} y={0} width={w} height={height} fill="#0a1628" />
            ) : null;
            x += w;
            return rect;
          });
        })()}
      </svg>
      <span className="text-[8px] font-mono text-muted-foreground tracking-widest">{value}</span>
    </div>
  );
}
