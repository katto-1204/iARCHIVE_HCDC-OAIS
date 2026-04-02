import * as React from "react";
import { getHeatmapColor, computeFieldCoverage } from "@/data/metadataUtils";
import type { ArchivalMaterial } from "@/data/sampleData";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FieldHeatmapProps {
  materials: ArchivalMaterial[];
  className?: string;
}

export function FieldHeatmap({ materials, className = "" }: FieldHeatmapProps) {
  const coverage = React.useMemo(() => computeFieldCoverage(materials), [materials]);

  return (
    <div className={className}>
      <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
        {coverage.map(({ field, percentage, filledCount, totalCount }) => (
          <Tooltip key={field.code}>
            <TooltipTrigger asChild>
              <div
                className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md border border-black/5 relative group"
                style={{ backgroundColor: getHeatmapColor(percentage) + "30", borderColor: getHeatmapColor(percentage) + "60" }}
              >
                <div
                  className="absolute inset-0 rounded-lg opacity-20"
                  style={{ backgroundColor: getHeatmapColor(percentage) }}
                />
                <span className="text-[9px] font-bold text-[#0a1628] relative z-10 leading-tight text-center px-0.5">
                  {field.code}
                </span>
                <span className="text-[8px] font-semibold relative z-10" style={{ color: getHeatmapColor(percentage) }}>
                  {percentage}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
              <div className="space-y-1">
                <p className="font-bold text-xs">{field.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {field.code} · {field.standard}
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getHeatmapColor(percentage) }}
                  />
                  <span className="text-[10px]">
                    {filledCount}/{totalCount} records ({percentage}%)
                  </span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 justify-center">
        {[
          { color: "#10B981", label: "100%" },
          { color: "#F59E0B", label: "67–99%" },
          { color: "#FCA5A5", label: "33–66%" },
          { color: "#D1D5DB", label: "<33%" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: l.color + "50", borderColor: l.color, borderWidth: 1 }} />
            <span className="text-[10px] text-muted-foreground font-medium">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
