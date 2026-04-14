import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MetadataFieldSelector, type MetadataField, STANDARD_METADATA_CATEGORIES } from "./MetadataFieldSelector";
import { MetadataPreview } from "./MetadataPreview";
import { useUpdateCategory } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/lib/utils";

interface Props {
  category: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  fondsName?: string;
  subFondsName?: string;
}

export function MetadataConfigDialog({ 
  category, 
  isOpen, 
  onClose, 
  onSaved,
  fondsName,
  subFondsName 
}: Props) {
  const [step, setStep] = React.useState<"select" | "preview">("select");
  const [selectedFieldIds, setSelectedFieldIds] = React.useState<string[]>([]);
  const [customFields, setCustomFields] = React.useState<MetadataField[]>([]);
  const { mutate: update, isPending } = useUpdateCategory();
  const { toast } = useToast();

  // Initialize from category schema
  React.useEffect(() => {
    if (isOpen && category?.metadataSchema) {
      setSelectedFieldIds(category.metadataSchema.fieldIds || []);
      setCustomFields(category.metadataSchema.customFields || []);
      setStep("select");
    } else if (isOpen) {
      // Default fields if none configured
      const defaultFields = ["identifier", "title", "dates", "url"];
      setSelectedFieldIds(defaultFields);
      setCustomFields([]);
      setStep("select");
    }
  }, [isOpen, category]);

  const handleAddCustom = (name: string, categoryId: string) => {
    const newField: MetadataField = {
      id: `custom_${generateId()}`,
      name,
      category: categoryId,
      isCustom: true
    };
    setCustomFields(prev => [...prev, newField]);
    setSelectedFieldIds(prev => [...prev, newField.id]);
  };

  const handleRemoveCustom = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
    setSelectedFieldIds(prev => prev.filter(fid => fid !== id));
  };

  const handleSave = () => {
    update(
      { 
        id: category.id, 
        data: { 
          metadataSchema: {
            fieldIds: selectedFieldIds,
            customFields: customFields
          }
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Configuration Saved", description: `Metadata fields for "${category.name}" have been updated.` });
          onSaved?.();
          onClose();
        },
        onError: () => {
          toast({ title: "Save Failed", description: "There was a problem updating the series configuration.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 gap-0 border-none shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b px-8 py-6">
          <DialogTitle className="text-2xl font-display font-bold text-[#0a1628]">
             Configure Metadata Scheme
          </DialogTitle>
          <DialogDescription className="mt-1">
             Define the required and optional fields for the "{category?.name}" series.
          </DialogDescription>
        </div>

        <div className="p-8">
          {step === "select" ? (
            <div className="space-y-8">
              <MetadataFieldSelector 
                selectedFieldIds={selectedFieldIds}
                onChange={setSelectedFieldIds}
                customFields={customFields}
                onAddCustomField={handleAddCustom}
                onRemoveCustomField={handleRemoveCustom}
              />
              <div className="flex justify-end pt-6 border-t mt-10">
                <button 
                  onClick={() => setStep("preview")}
                  className="bg-[#1a3b5b] text-white px-8 py-2.5 rounded-lg font-bold hover:bg-[#0a2640] transition-colors shadow-md"
                >
                  Preview & save →
                </button>
              </div>
            </div>
          ) : (
            <MetadataPreview 
              seriesName={category?.name}
              fondsName={fondsName}
              subFondsName={subFondsName}
              selectedFieldIds={selectedFieldIds}
              customFields={customFields}
              onBack={() => setStep("select")}
              onSave={handleSave}
              isSaving={isPending}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
