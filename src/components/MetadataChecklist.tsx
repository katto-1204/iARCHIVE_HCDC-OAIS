import * as React from "react";
import { COMBINED_FIELDS, ISADG_AREAS } from "@/data/sampleData";
import { CheckCircle2, FileText, X } from "lucide-react";
import { Input } from "@/components/ui-components";
import { cn } from "@/lib/utils";

interface MetadataChecklistProps {
  selectedFields: Set<string>;
  onToggle: (fieldKey: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  values?: Record<string, string>;
  onValueChange?: (fieldKey: string, value: string) => void;
  className?: string;
  allowedFieldIds?: string[];
  mode?: "select" | "fill";
}

export function MetadataChecklist({
  selectedFields,
  onToggle,
  onSelectAll,
  onClearAll,
  values = {},
  onValueChange,
  className = "",
  allowedFieldIds,
  mode = "fill",
}: MetadataChecklistProps) {
  
  const displayedFields = React.useMemo(() => {
    let fields = COMBINED_FIELDS;
    if (allowedFieldIds && allowedFieldIds.length > 0) {
      fields = fields.filter(f => allowedFieldIds.includes(f.fieldKey));
    }
    if (mode === "fill" && selectedFields.size > 0) {
      fields = fields.filter(f => selectedFields.has(f.fieldKey));
    }
    return fields;
  }, [allowedFieldIds, selectedFields, mode]);

  // Group fields by ISAD(G) Area
  const groupedFields = React.useMemo(() => {
    const groups: Record<string, typeof COMBINED_FIELDS> = {};
    const fieldsToGroup = allowedFieldIds && allowedFieldIds.length > 0 
      ? COMBINED_FIELDS.filter(f => allowedFieldIds.includes(f.fieldKey)) 
      : COMBINED_FIELDS;

    fieldsToGroup.forEach(f => {
      const areaName = f.areaName || "Other Metadata";
      if (!groups[areaName]) groups[areaName] = [];
      groups[areaName].push(f);
    });
    return groups;
  }, [allowedFieldIds]);

  const totalFields = displayedFields.length;
  const filledFieldsCount = displayedFields.filter(f => !!values[f.fieldKey]).length;

  if (mode === "select") {
    const orderedAreas = [
      ...ISADG_AREAS.map(a => a.name),
      "Dublin Core Supplement",
      "Other Metadata"
    ];

    return (
      <div className={cn("w-full bg-[#fafbfc] rounded-2xl p-6", className)}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0a1628] flex items-center gap-2">
               <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-black">03</span> 
               Select applicable metadata fields
            </h2>
            <p className="text-sm text-slate-500 mt-1 ml-10">Only checked fields will appear in the upload form for this series</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onSelectAll} className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">Select All</button>
            <button onClick={onClearAll} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Clear All</button>
          </div>
        </div>

        <div className="space-y-8">
          {orderedAreas.map((areaName, idx) => {
            const fields = groupedFields[areaName];
            if (!fields || fields.length === 0) return null;
            const letter = String.fromCharCode(65 + idx); // A, B, C...
            
            return (
              <div key={areaName}>
                <h3 className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-400 mb-3 ml-2 flex items-center gap-2">
                   <span>{letter}.</span> {areaName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {fields.map(field => (
                    <label 
                      key={field.code} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-white shadow-sm",
                        selectedFields.has(field.fieldKey) 
                          ? "border-blue-500 bg-blue-50/30" 
                          : "border-slate-200 bg-[#f7f8fc]"
                      )}
                    >
                      <div className="flex items-center justify-center w-5 h-5 rounded overflow-hidden shrink-0">
                         <input 
                           type="checkbox" 
                           checked={selectedFields.has(field.fieldKey)}
                           onChange={() => onToggle(field.fieldKey)}
                           className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                         />
                      </div>
                      <span className={cn(
                        "text-sm font-medium", 
                        selectedFields.has(field.fieldKey) ? "text-[#0a1628]" : "text-slate-600"
                      )}>{field.name}</span>
                      {field.isEssential && <span className="text-red-500 text-xs ml-auto font-bold">*</span>}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 text-sm font-bold text-slate-500">
           {selectedFields.size} fields selected
        </div>
      </div>
    );
  }

  // mode === "fill"
  return (
    <div className={cn("w-full bg-[#fafbfc] rounded-2xl", className)}>
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
              <div className="grid grid-cols-[80px_1.2fr_90px_2fr_60px] gap-4 px-6 py-3 border-b bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-500">
                <span>Code</span>
                <span>Field</span>
                <span className="text-center">Standard</span>
                <span>Value</span>
                <span className="text-center">Status</span>
              </div>
              
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
                      
                      <div className="pr-4">
                         <Input 
                          className="h-9 text-sm bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-500 transition-all font-medium text-slate-700 w-full shadow-none" 
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
