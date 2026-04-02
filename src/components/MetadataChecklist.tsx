import * as React from "react";
import { COMBINED_FIELDS, ISADG_AREAS, type MetadataFieldDef } from "@/data/sampleData";
import { CheckCircle2, Circle } from "lucide-react";

interface MetadataChecklistProps {
  selectedFields: Set<string>;
  onToggle: (fieldKey: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  className?: string;
}

export function MetadataChecklist({
  selectedFields,
  onToggle,
  onSelectAll,
  onClearAll,
  className = "",
}: MetadataChecklistProps) {
  // Group fields by area
  const groupedFields = React.useMemo(() => {
    const groups: Array<{
      areaNumber: number;
      areaName: string;
      color: string;
      fields: MetadataFieldDef[];
    }> = [];

    // ISAD(G) areas 1-7
    for (const area of ISADG_AREAS) {
      const fields = COMBINED_FIELDS.filter(f => f.area === area.number);
      if (fields.length > 0) {
        groups.push({
          areaNumber: area.number,
          areaName: area.name,
          color: area.color,
          fields,
        });
      }
    }

    // Dublin Core supplementary (area 0)
    const dcOnly = COMBINED_FIELDS.filter(f => f.area === 0);
    if (dcOnly.length > 0) {
      groups.push({
        areaNumber: 0,
        areaName: "Dublin Core Supplement",
        color: "#0EA5E9",
        fields: dcOnly,
      });
    }

    return groups;
  }, []);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{selectedFields.size}</span> of{" "}
          <span className="font-bold text-foreground">{COMBINED_FIELDS.length}</span> fields selected
        </div>
        <div className="flex gap-2">
          <button
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            onClick={onSelectAll}
          >
            Select All
          </button>
          <span className="text-muted-foreground/30">·</span>
          <button
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClearAll}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Grouped checkboxes */}
      {groupedFields.map(group => (
        <div key={group.areaNumber} className="border border-border/60 rounded-xl overflow-hidden">
          <div
            className="px-4 py-2.5 flex items-center gap-2 border-b"
            style={{ backgroundColor: group.color + "08", borderColor: group.color + "20" }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: group.color }}>
              {group.areaNumber > 0 ? `Area ${group.areaNumber}: ` : ""}{group.areaName}
            </h4>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {group.fields.filter(f => selectedFields.has(f.fieldKey)).length}/{group.fields.length}
            </span>
          </div>
          <div className="divide-y divide-border/30">
            {group.fields.map(field => {
              const isSelected = selectedFields.has(field.fieldKey);
              return (
                <button
                  key={field.code}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/3" : ""}`}
                  onClick={() => onToggle(field.fieldKey)}
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${isSelected ? "font-semibold text-foreground" : "text-foreground/70"}`}>
                      {field.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono text-muted-foreground/60 bg-muted/60 px-1.5 py-0.5 rounded">
                      {field.code}
                    </span>
                    {field.standard === "Both" && (
                      <span className="text-[8px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">DUAL</span>
                    )}
                    {field.standard === "Dublin Core" && (
                      <span className="text-[8px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">DC</span>
                    )}
                    {field.standard === "ISAD(G)" && (
                      <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">ISAD</span>
                    )}
                    {field.isEssential && (
                      <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">REQ</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
