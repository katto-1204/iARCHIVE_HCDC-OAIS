import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { STANDARD_METADATA_CATEGORIES, type MetadataField } from "./MetadataFieldSelector";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui-components";

interface Props {
  seriesName: string;
  fondsName?: string;
  subFondsName?: string;
  selectedFieldIds: string[];
  customFields: MetadataField[];
  onBack: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function MetadataPreview({
  seriesName,
  fondsName,
  subFondsName,
  selectedFieldIds,
  customFields,
  onBack,
  onSave,
  isSaving
}: Props) {
  // Group selected fields by category
  const selectedFieldsByCategory = STANDARD_METADATA_CATEGORIES.map(cat => {
    const fields = [
      ...cat.fields,
      ...customFields.filter(f => f.category === cat.id)
    ].filter(f => selectedFieldIds.includes(f.id));

    return { ...cat, fields };
  }).filter(cat => cat.fields.length > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Success Header */}
      <div className="flex items-start gap-3 mb-8">
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#0a1628]">Preview — confirm before saving</h3>
          <p className="text-sm text-muted-foreground">These metadata fields will appear for uploaders in this series</p>
        </div>
      </div>

      {/* Series Info Card */}
      <div className="bg-[#f9f9f9] border rounded-xl overflow-hidden shadow-sm">
        <div className="bg-primary/5 px-4 py-2 border-b flex items-center gap-2">
           <Badge variant="outline" className="bg-white px-2 py-0 h-5 text-[10px] font-bold uppercase border-primary/20 text-primary">
             Series
           </Badge>
           <span className="font-bold text-[#0a1628]">{seriesName}</span>
        </div>
        <div className="p-4 space-y-2">
          {fondsName && (
            <div className="flex justify-between text-sm py-1 border-b border-border/40">
              <span className="text-muted-foreground">Fonds</span>
              <span className="font-bold text-[#0a1628]">{fondsName}</span>
            </div>
          )}
          {subFondsName && (
            <div className="flex justify-between text-sm py-1 border-b border-border/40">
              <span className="text-muted-foreground">Sub-fonds</span>
              <span className="font-bold text-[#0a1628]">{subFondsName}</span>
            </div>
          )}
          <div className="flex justify-between text-sm py-1 border-b border-border/40">
            <span className="text-muted-foreground">Series</span>
            <span className="font-bold text-[#0a1628]">{seriesName}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-muted-foreground">Fields selected</span>
            <span className="font-bold text-primary">{selectedFieldIds.length}</span>
          </div>
        </div>
      </div>

      {/* Grouped Fields Summary */}
      <div className="space-y-6">
        {selectedFieldsByCategory.map(cat => (
          <div key={cat.id} className="space-y-3">
            <h5 className="text-[10px] font-bold tracking-[1.5px] text-muted-foreground uppercase flex items-center gap-2">
              {cat.id}. {cat.name}
              <div className="h-[1px] flex-1 bg-border/40" />
            </h5>
            <div className="flex flex-wrap gap-2">
              {cat.fields.map(field => (
                <Badge 
                  key={field.id} 
                  variant="secondary" 
                  className="bg-primary/5 border border-primary/20 text-primary px-3 py-1.5 text-xs font-semibold rounded-lg"
                >
                  {field.name}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="h-11 px-8 gap-2 border-muted-foreground/20 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Edit fields
        </Button>
        <Button 
           onClick={onSave}
           disabled={isSaving}
           className="h-11 px-10 gap-2 bg-[#1a3b5b] hover:bg-[#0a2640] shadow-md ml-auto"
        >
          {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {isSaving ? "Saving..." : "Save series"}
        </Button>
      </div>
    </div>
  );
}
