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

export const STANDARD_METADATA_CATEGORIES: { id: string; name: string; fields: MetadataField[] }[] = [
  {
    id: "A",
    name: "IDENTITY STATEMENT",
    fields: [
      { id: "ref_code", name: "Reference code", category: "A" },
      { id: "alt_title", name: "Alternative title", category: "A" },
      { id: "level_desc", name: "Level of description", category: "A" },
      { id: "identifier", name: "Identifier", category: "A" },
      { id: "title", name: "Title", category: "A" },
      { id: "dates", name: "Dates", category: "A" },
      { id: "extent_medium", name: "Extent and medium", category: "A" },
      { id: "url", name: "URL", category: "A" },
    ]
  },
  {
    id: "B",
    name: "CONTEXT",
    fields: [
      { id: "creator", name: "Name of creator", category: "B" },
      { id: "archival_history", name: "Archival history", category: "B" },
      { id: "publisher", name: "Publisher", category: "B" },
      { id: "admin_history", name: "Administrative/biographical history", category: "B" },
      { id: "source", name: "Source / acquisition", category: "B" },
      { id: "contributor", name: "Contributor", category: "B" },
    ]
  },
  {
    id: "C",
    name: "CONTENT AND STRUCTURE",
    fields: [
      { id: "scope", name: "Scope and content", category: "C" },
      { id: "accruals", name: "Accruals", category: "C" },
      { id: "keywords", name: "Subject/keywords", category: "C" },
      { id: "format", name: "Format", category: "C" },
      { id: "appraisal", name: "Appraisal / destruction info", category: "C" },
      { id: "arrangement", name: "System of arrangement", category: "C" },
      { id: "type", name: "Type", category: "C" },
    ]
  },
  {
    id: "D",
    name: "ACCESS AND USE",
    fields: [
      { id: "access_cond", name: "Conditions governing access", category: "D" },
      { id: "language", name: "Language/scripts of material", category: "D" },
      { id: "finding_aids", name: "Finding aids", category: "D" },
      { id: "rights", name: "Conditions governing reproduction/rights", category: "D" },
      { id: "physical_chars", name: "Physical characteristics", category: "D" },
    ]
  },
  {
    id: "E",
    name: "ALLIED MATERIALS",
    fields: [
      { id: "originals_existence", name: "Existence of originals", category: "E" },
      { id: "related_units", name: "Related units of description", category: "E" },
      { id: "copies_existence", name: "Existence of copies", category: "E" },
      { id: "pub_note", name: "Publication note", category: "E" },
    ]
  },
  {
    id: "F",
    name: "COVERAGE",
    fields: [
      { id: "temporal", name: "Temporal coverage", category: "F" },
      { id: "geographic", name: "Geographic coverage", category: "F" },
    ]
  },
  {
    id: "G",
    name: "NOTES",
    fields: [
      { id: "general_note", name: "General note", category: "G" },
    ]
  },
  {
    id: "H",
    name: "DESCRIPTION CONTROL",
    fields: [
      { id: "archivist_note", name: "Archivist's note", category: "H" },
      { id: "desc_rules", name: "Rules or conventions", category: "H" },
      { id: "desc_date", name: "Date of description", category: "H" },
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
