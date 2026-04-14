import * as React from "react";
import { COMBINED_FIELDS } from "@/data/sampleData";
import { CheckCircle2, FileText, X } from "lucide-react";
import { Input } from "@/components/ui-components";
import { cn } from "@/lib/utils";

interface MetadataChecklistProps {
  // `selectedFields` and related props are no longer strictly needed for toggling rows,
  // but we keep the props signature to avoid breaking parent components.
  selectedFields: Set<string>;
  onToggle: (fieldKey: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  values?: Record<string, string>;
  onValueChange?: (fieldKey: string, value: string) => void;
  className?: string;
  allowedFieldIds?: string[]; // New prop for dynamic filtering
}

export function MetadataChecklist({
  values = {},
  onValueChange,
  className = "",
  allowedFieldIds,
}: MetadataChecklistProps) {
  
  // Filter fields if allowedFieldIds is provided
  const displayedFields = React.useMemo(() => {
    if (!allowedFieldIds || allowedFieldIds.length === 0) return COMBINED_FIELDS;
    return COMBINED_FIELDS.filter(f => allowedFieldIds.includes(f.fieldKey));
  }, [allowedFieldIds]);

  const totalFields = displayedFields.length;
  const filledFieldsCount = displayedFields.filter(f => !!values[f.fieldKey]).length;

  return (
    <div className={cn("w-full bg-[#fafbfc] rounded-2xl", className)}>
      {/* ═══ FULL METADATA ONE COLUMN ═══ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#0a1628]" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[#0a1628]">
            {allowedFieldIds ? "RELEVANT SERIES METADATA" : "FULL METADATA"} ({filledFieldsCount}/{totalFields} FIELDS)
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[600px]">
              {/* Table Header */}
              <div className="grid grid-cols-[80px_1.2fr_90px_2fr_60px] gap-4 px-6 py-3 border-b bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-500">
                <span>Code</span>
                <span>Field</span>
                <span className="text-center">Standard</span>
                <span>Value</span>
                <span className="text-center">Status</span>
              </div>
              
              {/* Table Body (No Scrollbar, fit content) */}
              <div className="divide-y divide-slate-100">
                {displayedFields.map(field => {
                  const val = values[field.fieldKey] || "";
                  return (
                    <div 
                      key={field.code} 
                      className="grid grid-cols-[80px_1.2fr_90px_2fr_60px] gap-4 px-6 py-3 items-center transition-colors hover:bg-slate-50"
                    >
                      <span className="text-xs font-mono font-bold text-slate-400">{field.code}</span>
                      
                      <span className="text-sm font-bold text-[#0a1628] leading-tight flex items-center gap-1">
                        {field.name} {field.isEssential && <span className="text-red-500">*</span>}
                      </span>
                      
                      <div className="flex justify-center">
                        <span className="text-[10px] font-bold text-blue-600/60 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter italic whitespace-nowrap">
                           {field.standard === "Both" ? "ISAD/DC" : field.standard}
                        </span>
                      </div>
                      
                      {/* EDITABLE VALUE */}
                      <div className="pr-4">
                         <Input 
                          className="h-9 text-sm bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 transition-all font-medium text-slate-700 w-full" 
                          value={val} 
                          onChange={(e) => onValueChange?.(field.fieldKey, e.target.value)} 
                          placeholder="Enter value..." 
                         />
                      </div>
                      
                      <div className="flex justify-center">
                        {val ? (
                           <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                           <X className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
