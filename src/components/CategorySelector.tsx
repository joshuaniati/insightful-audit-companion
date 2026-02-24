interface AuditCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

const CATEGORIES: AuditCategory[] = [
  { id: "financial", name: "Financial Compliance", color: "text-primary", description: "PFMA, Companies Act, Tax Administration Act, MFMA" },
  { id: "health-safety", name: "Health & Safety", color: "text-destructive", description: "Occupational Health & Safety Act (OHS Act 85 of 1993)" },
  { id: "labour", name: "Labour Relations", color: "text-warning", description: "BCEA, LRA, EEA, Skills Development Act" },
  { id: "bbbee", name: "B-BBEE Compliance", color: "text-accent", description: "Broad-Based Black Economic Empowerment Act" },
  { id: "popia", name: "Data Protection (POPIA)", color: "text-success", description: "Protection of Personal Information Act" },
  { id: "environmental", name: "Environmental Compliance", color: "text-primary", description: "NEMA, National Water Act, Waste Act" },
  { id: "quality", name: "Quality Management", color: "text-warning", description: "ISO Standards, SABS, Quality Control procedures" },
  { id: "corporate", name: "Corporate Governance", color: "text-destructive", description: "King IV Code, Companies Act governance requirements" },
  { id: "municipal", name: "Municipal Compliance", color: "text-success", description: "Municipal Systems Act, Municipal Structures Act, MFMA" },
  { id: "construction", name: "Construction & Building", color: "text-accent", description: "NHBRC, Construction Regulations, Building Standards" },
];

interface CategorySelectorProps {
  selected: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

const CategorySelector = ({ selected, onToggle, onSelectAll, onClear }: CategorySelectorProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-heading font-semibold text-sm text-navy-foreground">Audit Categories</span>
        <div className="flex gap-2">
          <button onClick={onSelectAll} className="text-xs text-primary hover:underline cursor-pointer bg-transparent border-none font-heading font-semibold">
            Select All
          </button>
          <button onClick={onClear} className="text-xs text-muted-foreground hover:underline cursor-pointer bg-transparent border-none font-heading font-semibold">
            Clear
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat.id);
          return (
            <label
              key={cat.id}
              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "border-accent bg-accent/5"
                  : "border-border bg-background hover:border-primary"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(cat.id)}
                className="accent-accent mt-0.5 shrink-0"
              />
              <div>
                <strong className={`block font-heading text-sm ${cat.color}`}>{cat.name}</strong>
                <span className="text-xs text-muted-foreground">{cat.description}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelector;
export { CATEGORIES };
export type { AuditCategory };
