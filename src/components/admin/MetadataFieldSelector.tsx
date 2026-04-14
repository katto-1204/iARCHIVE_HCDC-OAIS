import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui-components";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MetadataField {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

export const STANDARD_METADATA_CATEGORIES = [
  {
    id: "A",
    name: "IDENTITY STATEMENT",
    fields: [
      { id: "ref_code", name: "Reference code" },
      { id: "alt_title", name: "Alternative title" },
      { id: "level_desc", name: "Level of description" },
      { id: "identifier", name: "Identifier" },
      { id: "title", name: "Title" },
      { id: "dates", name: "Dates" },
      { id: "extent_medium", name: "Extent and medium" },
      { id: "url", name: "URL" },
    ]
  },
  {
    id: "B",
    name: "CONTEXT",
    fields: [
      { id: "creator", name: "Name of creator" },
      { id: "archival_history", name: "Archival history" },
      { id: "publisher", name: "Publisher" },
      { id: "admin_history", name: "Administrative/biographical history" },
      { id: "source", name: "Source / acquisition" },
      { id: "contributor", name: "Contributor" },
    ]
  },
  {
    id: "C",
    name: "CONTENT AND STRUCTURE",
    fields: [
      { id: "scope", name: "Scope and content" },
      { id: "accruals", name: "Accruals" },
      { id: "keywords", name: "Subject/keywords" },
      { id: "format", name: "Format" },
      { id: "appraisal", name: "Appraisal / destruction info" },
      { id: "arrangement", name: "System of arrangement" },
      { id: "type", name: "Type" },
    ]
  },
  {
    id: "D",
    name: "ACCESS AND USE",
    fields: [
      { id: "access_cond", name: "Conditions governing access" },
      { id: "language", name: "Language/scripts of material" },
      { id: "finding_aids", name: "Finding aids" },
      { id: "rights", name: "Conditions governing reproduction/rights" },
      { id: "physical_chars", name: "Physical characteristics" },
    ]
  },
  {
    id: "E",
    name: "ALLIED MATERIALS",
    fields: [
      { id: "originals_existence", name: "Existence of originals" },
      { id: "related_units", name: "Related units of description" },
      { id: "copies_existence", name: "Existence of copies" },
      { id: "pub_note", name: "Publication note" },
    ]
  },
  {
    id: "F",
    name: "COVERAGE",
    fields: [
      { id: "temporal", name: "Temporal coverage" },
      { id: "geographic", name: "Geographic coverage" },
    ]
  },
  {
    id: "G",
    name: "NOTES",
    fields: [
      { id: "general_note", name: "General note" },
    ]
  },
  {
    id: "H",
    name: "DESCRIPTION CONTROL",
    fields: [
      { id: "archivist_note", name: "Archivist's note" },
      { id: "desc_rules", name: "Rules or conventions" },
      { id: "desc_date", name: "Date of description" },
    ]
  }
];

interface Props {
  selectedFieldIds: string[];
  onChange: (ids: string[]) => void;
  customFields: MetadataField[];
  onAddCustomField: (name: string, categoryId: string) => void;
  onRemoveCustomField: (id: string) => void;
}

export function MetadataFieldSelector({ 
  selectedFieldIds, 
  onChange, 
  customFields, 
  onAddCustomField,
  onRemoveCustomField 
}: Props) {
  const [newFieldName, setNewFieldName] = React.useState("");
  const [newFieldCategory, setNewFieldCategory] = React.useState("A");

  const toggleField = (id: string) => {
    if (selectedFieldIds.includes(id)) {
      onChange(selectedFieldIds.filter(f => f !== id));
    } else {
      onChange([...selectedFieldIds, id]);
    }
  };

  const handleAddCustom = () => {
    if (!newFieldName.trim()) return;
    onAddCustomField(newFieldName.trim(), newFieldCategory);
    setNewFieldName("");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Step Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
          03
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#0a1628]">Select applicable metadata fields</h3>
          <p className="text-sm text-muted-foreground">Only checked fields will appear in the upload form for this series</p>
        </div>
      </div>

      {/* Custom Fields Section */}
      <div className="bg-[#fdf9f4] border border-[#e8dfd5] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-[#5d5449]">Custom fields — assigned to a section of your choice</h4>
          <Button variant="link" size="sm" className="text-primary h-auto p-0 text-xs font-bold underline">
            + add / remove custom fields
          </Button>
        </div>

        {customFields.length === 0 ? (
          <p className="text-xs text-muted-foreground italic mb-4">No custom fields added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {customFields.map(f => (
              <Badge key={f.id} variant="secondary" className="bg-white border-[#e8dfd5] text-[#5d5449] gap-1 px-2 py-1">
                {f.name} ({f.category})
                <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onRemoveCustomField(f.id)} />
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Input 
            placeholder="New field name..." 
            value={newFieldName}
            onChange={e => setNewFieldName(e.target.value)}
            className="bg-white h-11 border-[#e8dfd5] focus:ring-primary/20" 
          />
          <Select value={newFieldCategory} onValueChange={setNewFieldCategory}>
            <SelectTrigger className="bg-white h-11 border-[#e8dfd5] w-full sm:w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STANDARD_METADATA_CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.id}. {cat.name.charAt(0) + cat.name.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddCustom} variant="outline" className="h-11 border-[#e8dfd5] bg-white group hover:bg-primary hover:text-white transition-all shadow-sm">
            Add
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-10">
        {STANDARD_METADATA_CATEGORIES.map(cat => (
          <div key={cat.id} className="space-y-4">
            <h5 className="text-[11px] font-bold tracking-[2px] text-muted-foreground uppercase flex items-center gap-2">
              {cat.id}. {cat.name}
              <div className="h-[1px] flex-1 bg-border/40" />
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...cat.fields, ...customFields.filter(f => f.category === cat.id)].map(field => (
                <div 
                  key={field.id}
                  onClick={() => toggleField(field.id)}
                  className={cn(
                    "flex items-center p-3 rounded-lg border transition-all cursor-pointer group",
                    selectedFieldIds.includes(field.id) 
                      ? "bg-primary/5 border-primary/30 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]" 
                      : "bg-[#f9f9f9]/50 border-transparent hover:bg-muted/10 hover:border-border/60"
                  )}
                >
                  <Checkbox 
                    id={field.id}
                    checked={selectedFieldIds.includes(field.id)}
                    className="mr-3 border-[#ccc] data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    selectedFieldIds.includes(field.id) ? "text-primary" : "text-[#1a2b3b]"
                  )}>
                    {field.name}
                    {field.isCustom && <span className="ml-2 text-[10px] opacity-60 italic">(Custom)</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
