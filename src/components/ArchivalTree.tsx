import * as React from "react";
import { ChevronRight, Folder, FolderOpen, FileText, File, Archive } from "lucide-react";
import { LEVEL_COLORS, LEVEL_LABELS, type HierarchyNode, type HierarchyLevel } from "@/data/sampleData";

interface ArchivalTreeProps {
  node: HierarchyNode;
  selectedId?: string | null;
  onSelectItem?: (materialId: string) => void;
  depth?: number;
}

const LEVEL_ICONS: Record<HierarchyLevel, React.ElementType> = {
  fonds: Archive,
  subfonds: Folder,
  series: Folder,
  subseries: Folder,
  file: FileText,
  item: File,
};

function TreeNode({ node, selectedId, onSelectItem, depth = 0 }: ArchivalTreeProps) {
  const [expanded, setExpanded] = React.useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isItem = node.level === "item";
  const isSelected = node.materialId && node.materialId === selectedId;
  const Icon = LEVEL_ICONS[node.level];
  const color = LEVEL_COLORS[node.level];

  const itemCount = React.useMemo(() => {
    if (!node.children) return 0;
    function countItems(n: HierarchyNode): number {
      if (n.level === "item") return 1;
      return n.children?.reduce((sum, child) => sum + countItems(child), 0) ?? 0;
    }
    return countItems(node);
  }, [node]);

  return (
    <div>
      <button
        className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-left text-sm transition-all duration-150 group
          ${isItem ? "hover:bg-primary/5 cursor-pointer" : "hover:bg-muted/50"}
          ${isSelected ? "bg-primary/10 ring-1 ring-primary/30" : ""}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isItem && node.materialId && onSelectItem) {
            onSelectItem(node.materialId);
          } else if (hasChildren) {
            setExpanded(!expanded);
          }
        }}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-200 text-muted-foreground/60 shrink-0 ${expanded ? "rotate-90" : ""}`}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {/* Level icon */}
        <div
          className="w-6 h-6 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "18" }}
        >
          {expanded && hasChildren ? (
            <FolderOpen className="w-3.5 h-3.5" style={{ color }} />
          ) : (
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          )}
        </div>

        {/* Name and level badge */}
        <div className="flex-1 min-w-0">
          <span className={`block truncate text-[13px] ${isSelected ? "font-bold text-primary" : isItem ? "text-foreground font-medium" : "text-foreground/80 font-semibold"}`}>
            {node.name}
          </span>
        </div>

        {/* Level tag + count */}
        <div className="flex items-center gap-2 shrink-0">
          {!isItem && itemCount > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground/50 bg-muted/60 px-1.5 py-0.5 rounded">
              {itemCount}
            </span>
          )}
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ color, backgroundColor: color + "15" }}
          >
            {LEVEL_LABELS[node.level]}
          </span>
        </div>
      </button>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="relative">
          {/* Vertical tree line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-border/50"
            style={{ left: `${depth * 16 + 20}px` }}
          />
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelectItem={onSelectItem}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ArchivalTree({ node, selectedId, onSelectItem }: ArchivalTreeProps) {
  return (
    <div className="py-2">
      <TreeNode node={node} selectedId={selectedId} onSelectItem={onSelectItem} depth={0} />
    </div>
  );
}
