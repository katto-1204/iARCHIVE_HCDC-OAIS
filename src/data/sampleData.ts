// ═══════════════════════════════════════════════════════════════════════════════
// iArchive — ISAD(G) + Dublin Core Metadata Definitions & Sample Data
// ═══════════════════════════════════════════════════════════════════════════════

// ─── ISAD(G) 26 Elements grouped by 7 Areas ──────────────────────────────────

export interface MetadataFieldDef {
  code: string;        // e.g. "ISAD1.1", "DC1"
  name: string;        // e.g. "Reference Code"
  standard: "ISAD(G)" | "Dublin Core" | "Both";
  area: number;        // ISAD(G) area number (1-7), 0 for DC-only
  areaName: string;
  isEssential: boolean;
  fieldKey: string;    // maps to material object property
}

export const ISADG_AREAS = [
  { number: 1, name: "Identity Statement", color: "#4169E1" },
  { number: 2, name: "Context", color: "#6366F1" },
  { number: 3, name: "Content & Structure", color: "#0EA5E9" },
  { number: 4, name: "Conditions of Access & Use", color: "#14B8A6" },
  { number: 5, name: "Allied Materials", color: "#F59E0B" },
  { number: 6, name: "Notes", color: "#8B5CF6" },
  { number: 7, name: "Description Control", color: "#EC4899" },
] as const;

// All 26 ISAD(G) fields
export const ISADG_FIELDS: MetadataFieldDef[] = [
  // Area 1: Identity Statement (5 fields)
  { code: "ISAD1.1", name: "Reference Code", standard: "ISAD(G)", area: 1, areaName: "Identity Statement", isEssential: true, fieldKey: "referenceCode" },
  { code: "ISAD1.2", name: "Title", standard: "Both", area: 1, areaName: "Identity Statement", isEssential: true, fieldKey: "title" },
  { code: "ISAD1.3", name: "Dates", standard: "Both", area: 1, areaName: "Identity Statement", isEssential: true, fieldKey: "date" },
  { code: "ISAD1.4", name: "Level of Description", standard: "ISAD(G)", area: 1, areaName: "Identity Statement", isEssential: true, fieldKey: "levelOfDescription" },
  { code: "ISAD1.5", name: "Extent and Medium", standard: "ISAD(G)", area: 1, areaName: "Identity Statement", isEssential: true, fieldKey: "extentAndMedium" },

  // Area 2: Context (4 fields)
  { code: "ISAD2.1", name: "Name of Creator", standard: "Both", area: 2, areaName: "Context", isEssential: true, fieldKey: "creator" },
  { code: "ISAD2.2", name: "Administrative/Biographical History", standard: "ISAD(G)", area: 2, areaName: "Context", isEssential: false, fieldKey: "adminBioHistory" },
  { code: "ISAD2.3", name: "Archival History", standard: "ISAD(G)", area: 2, areaName: "Context", isEssential: false, fieldKey: "archivalHistory" },
  { code: "ISAD2.4", name: "Immediate Source of Acquisition", standard: "ISAD(G)", area: 2, areaName: "Context", isEssential: false, fieldKey: "immediateSource" },

  // Area 3: Content & Structure (4 fields)
  { code: "ISAD3.1", name: "Scope and Content", standard: "Both", area: 3, areaName: "Content & Structure", isEssential: false, fieldKey: "scopeContent" },
  { code: "ISAD3.2", name: "Appraisal, Destruction, Scheduling", standard: "ISAD(G)", area: 3, areaName: "Content & Structure", isEssential: false, fieldKey: "appraisal" },
  { code: "ISAD3.3", name: "Accruals", standard: "ISAD(G)", area: 3, areaName: "Content & Structure", isEssential: false, fieldKey: "accruals" },
  { code: "ISAD3.4", name: "System of Arrangement", standard: "ISAD(G)", area: 3, areaName: "Content & Structure", isEssential: false, fieldKey: "arrangement" },

  // Area 4: Conditions of Access & Use (5 fields)
  { code: "ISAD4.1", name: "Conditions Governing Access", standard: "ISAD(G)", area: 4, areaName: "Conditions of Access & Use", isEssential: false, fieldKey: "accessConditions" },
  { code: "ISAD4.2", name: "Conditions Governing Reproduction", standard: "Both", area: 4, areaName: "Conditions of Access & Use", isEssential: false, fieldKey: "reproductionConditions" },
  { code: "ISAD4.3", name: "Language/Scripts of Material", standard: "Both", area: 4, areaName: "Conditions of Access & Use", isEssential: false, fieldKey: "language" },
  { code: "ISAD4.4", name: "Physical Characteristics", standard: "ISAD(G)", area: 4, areaName: "Conditions of Access & Use", isEssential: false, fieldKey: "physicalCharacteristics" },
  { code: "ISAD4.5", name: "Finding Aids", standard: "ISAD(G)", area: 4, areaName: "Conditions of Access & Use", isEssential: false, fieldKey: "findingAids" },

  // Area 5: Allied Materials (4 fields)
  { code: "ISAD5.1", name: "Existence and Location of Originals", standard: "ISAD(G)", area: 5, areaName: "Allied Materials", isEssential: false, fieldKey: "existenceOriginals" },
  { code: "ISAD5.2", name: "Existence and Location of Copies", standard: "ISAD(G)", area: 5, areaName: "Allied Materials", isEssential: false, fieldKey: "existenceCopies" },
  { code: "ISAD5.3", name: "Related Units of Description", standard: "Both", area: 5, areaName: "Allied Materials", isEssential: false, fieldKey: "relatedUnits" },
  { code: "ISAD5.4", name: "Publication Note", standard: "ISAD(G)", area: 5, areaName: "Allied Materials", isEssential: false, fieldKey: "publicationNote" },

  // Area 6: Notes (1 field)
  { code: "ISAD6.1", name: "Note", standard: "ISAD(G)", area: 6, areaName: "Notes", isEssential: false, fieldKey: "note" },

  // Area 7: Description Control (3 fields)
  { code: "ISAD7.1", name: "Archivist's Note", standard: "ISAD(G)", area: 7, areaName: "Description Control", isEssential: false, fieldKey: "archivistNote" },
  { code: "ISAD7.2", name: "Rules or Conventions", standard: "ISAD(G)", area: 7, areaName: "Description Control", isEssential: false, fieldKey: "rulesConventions" },
  { code: "ISAD7.3", name: "Date(s) of Description", standard: "ISAD(G)", area: 7, areaName: "Description Control", isEssential: false, fieldKey: "dateOfDescription" },
];

// 15 Dublin Core elements (some are dual-coded with ISAD(G))
export const DUBLIN_CORE_FIELDS: MetadataFieldDef[] = [
  { code: "DC1",  name: "Title",       standard: "Both", area: 1, areaName: "Identity Statement", isEssential: true, fieldKey: "title" },
  { code: "DC2",  name: "Creator",     standard: "Both", area: 2, areaName: "Context", isEssential: true, fieldKey: "creator" },
  { code: "DC3",  name: "Subject",     standard: "Dublin Core", area: 0, areaName: "Dublin Core Supplement", isEssential: false, fieldKey: "subject" },
  { code: "DC4",  name: "Description", standard: "Both", area: 3, areaName: "Content & Structure", isEssential: false, fieldKey: "description" },
  { code: "DC5",  name: "Publisher",   standard: "Dublin Core", area: 0, areaName: "Dublin Core Supplement", isEssential: false, fieldKey: "publisher" },
  { code: "DC6",  name: "Contributor", standard: "Dublin Core", area: 0, areaName: "Dublin Core Supplement", isEssential: false, fieldKey: "contributor" },
  { code: "DC7",  name: "Date",        standard: "Both", area: 1, areaName: "Identity Statement", isEssential: true, fieldKey: "date" },
  { code: "DC8",  name: "Type",        standard: "Dublin Core", area: 0, areaName: "Dublin Core Supplement", isEssential: false, fieldKey: "type" },
  { code: "DC9",  name: "Format",      standard: "Both", area: 4, areaName: "Conditions of Access & Use", isEssential: false, fieldKey: "format" },
  { code: "DC10", name: "Identifier",  standard: "Dublin Core", area: 0, areaName: "Dublin Core Supplement", isEssential: false, fieldKey: "identifier" },
  { code: "DC11", name: "Source",      standard: "Dublin Core", area: 0, areaName: "Dublin Core Supplement", isEssential: false, fieldKey: "source" },
  { code: "DC12", name: "Language",    standard: "Both", area: 4, areaName: "Conditions of Access & Use", isEssential: false, fieldKey: "language" },
  { code: "DC13", name: "Relation",    standard: "Both", area: 5, areaName: "Allied Materials", isEssential: false, fieldKey: "relation" },
  { code: "DC14", name: "Coverage",    standard: "Dublin Core", area: 0, areaName: "Dublin Core Supplement", isEssential: false, fieldKey: "coverage" },
  { code: "DC15", name: "Rights",      standard: "Both", area: 4, areaName: "Conditions of Access & Use", isEssential: false, fieldKey: "rights" },
];

// Combined unique fields: 26 ISAD(G) + supplementary Dublin Core (non-duplicate by fieldKey)
export const COMBINED_FIELDS: MetadataFieldDef[] = [
  ...ISADG_FIELDS,
  // Only DC fields that are NOT already represented in ISAD(G) — check by fieldKey
  ...DUBLIN_CORE_FIELDS.filter(dc =>
    !ISADG_FIELDS.some(ig => ig.fieldKey === dc.fieldKey)
  ),
];

// The 6 essential (required) ISAD(G) fields
export const ESSENTIAL_FIELDS = ISADG_FIELDS.filter(f => f.isEssential);

// ─── Archival Hierarchy (ISAD(G) structure) ───────────────────────────────────

export type HierarchyLevel = "fonds" | "subfonds" | "series" | "subseries" | "file" | "item";

export interface HierarchyNode {
  id: string;
  name: string;
  level: HierarchyLevel;
  children?: HierarchyNode[];
  materialId?: string;      // only for level="item"
}

export const LEVEL_COLORS: Record<HierarchyLevel, string> = {
  fonds: "#0B3D91",
  subfonds: "#4169E1",
  series: "#0EA5E9",
  subseries: "#14B8A6",
  file: "#6366F1",
  item: "#8B5CF6",
};

export const LEVEL_LABELS: Record<HierarchyLevel, string> = {
  fonds: "Fonds",
  subfonds: "Sub-fonds",
  series: "Series",
  subseries: "Sub-series",
  file: "File",
  item: "Item",
};

export const SAMPLE_HIERARCHY: HierarchyNode = {
  id: "hcdc_root",
  name: "HCDC — Holy Cross of Davao College",
  level: "fonds",
  children: [
    // --- The ORIGINAL ONES (that have items pointing to them) ---
    {
      id: "h-cet",
      name: "College of Engineering and Technology (CET)",
      level: "subfonds",
      children: [
        {
          id: "h-cet-research",
          name: "Faculty Research",
          level: "series",
          children: [
            {
              id: "h-cet-papers",
              name: "Research Papers",
              level: "subseries",
              children: [
                {
                  id: "h-cet-papers-file",
                  name: "2023 Faculty Publications",
                  level: "file",
                  children: [
                    { id: "h-item-quality", name: "Quality Education in Philippine HEIs", level: "item", materialId: "26iA020000004" },
                  ],
                },
              ],
            },
          ],
        },
        // BLIS MOVED HERE
        {
          id: "h-blis",
          name: "BLIS",
          level: "series",
          children: [
            {
              id: "h-blis-research",
              name: "Student Research",
              level: "subseries",
              children: [
                {
                  id: "h-blis-capstone",
                  name: "Capstone Projects",
                  level: "file",
                  children: [
                    {
                      id: "h-blis-cap-2024",
                      name: "2024 Capstone Projects",
                      level: "item",
                      children: [
                        { id: "h-item-elearn", name: "Implementing E-Learning in HCDC: A Capstone Study", level: "item", materialId: "26iA040000006" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { id: "s_bscpe", name: "BSCpE", level: "series" },
        { id: "s_bsece", name: "BSECE", level: "series" },
        { id: "s_bsit", name: "BSIT", level: "series" }
      ],
    },
    {
      id: "h-admin",
      name: "Administrative Records",
      level: "subfonds",
      children: [
        {
          id: "h-admin-plans",
          name: "Strategic Plans",
          level: "series",
          children: [
            {
              id: "h-admin-plans-file",
              name: "Institutional Plans 2020–2025",
              level: "file",
              children: [
                { id: "h-item-strategic", name: "HCDC Institutional Strategic Plan 2020–2025", level: "item", materialId: "26iA030000005" },
              ],
            },
          ],
        },
        {
          id: "h-admin-minutes",
          name: "Board Minutes",
          level: "series",
          children: [
            {
              id: "h-admin-minutes-file",
              name: "Board Minutes 2022",
              level: "file",
              children: [
                { id: "h-item-minutes", name: "HCDC Board of Trustees Minutes 2022", level: "item", materialId: "26iA030000008" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "h-publications",
      name: "Publications",
      level: "subfonds",
      children: [
        {
          id: "h-pub-yearbooks",
          name: "Yearbooks",
          level: "series",
          children: [
            {
              id: "h-pub-yb-file",
              name: "Yearbook Collection",
              level: "file",
              children: [
                { id: "h-item-yb2019", name: "HCDC Yearbook 2018–2019", level: "item", materialId: "26iA010000001" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "h-photos",
      name: "Photographs",
      level: "subfonds",
      children: [
        {
          id: "h-photos-historic",
          name: "Historic Photos",
          level: "series",
          children: [
            {
              id: "h-photos-hist-file",
              name: "Campus Photos 1960–1990",
              level: "file",
              children: [
                { id: "h-item-photos", name: "HCDC Campus Historic Photos 1960–1990", level: "item", materialId: "26iA050000007" },
              ],
            },
          ],
        },
      ],
    },

    // --- The NEWLY APPENDED DEPARTMENTS based on HCDC Course List ---
    {
      id: "ccje_sub",
      name: "College of Criminal Justice Education (CCJE)",
      level: "subfonds",
      children: [
        { id: "s_crim", name: "BS Criminology", level: "series" }
      ]
    },
    {
      id: "chatme_sub",
      name: "College of Hospitality & Tourism Management (CHATME)",
      level: "subfonds",
      children: [
        { id: "s_bshm", name: "BSHM", level: "series" },
        { id: "s_bstm", name: "BSTM", level: "series" }
      ]
    },
    {
      id: "husocom_sub",
      name: "College of Arts & Sciences (HUSOCOM)",
      level: "subfonds",
      children: [
        { id: "s_polsci", name: "AB PolSci", level: "series" },
        { id: "s_econ", name: "AB Econ", level: "series" },
        { id: "s_history", name: "AB History", level: "series" },
        { id: "s_phil", name: "AB Philosophy", level: "series" },
        { id: "s_comm", name: "BA Comm", level: "series" },
        { id: "s_els", name: "BA ELS", level: "series" },
        { id: "s_psych", name: "BS Psych", level: "series" },
        { id: "s_sw", name: "BSSW", level: "series" }
      ]
    },
    {
      id: "come_sub",
      name: "College of Maritime Education (COME)",
      level: "subfonds",
      children: [
        { id: "s_bsmt", name: "BSMT", level: "series" }
      ]
    },
    {
      id: "sbme_sub",
      name: "School of Business & Management (SBME)",
      level: "subfonds",
      children: [
        { id: "s_bsa", name: "BSA", level: "series" },
        { id: "s_bsba_fm", name: "BSBA-FM", level: "series" },
        { id: "s_bsba_hrm", name: "BSBA-HRM", level: "series" },
        { id: "s_bsba_mm", name: "BSBA-MM", level: "series" },
        { id: "s_bsca", name: "BSCA", level: "series" },
        { id: "s_bsma", name: "BSMA", level: "series" },
        { id: "s_bsrem", name: "BSREM", level: "series" }
      ]
    },
    {
      id: "ste_sub",
      name: "School of Teacher Education (STE)",
      level: "subfonds",
      children: [
        { id: "s_beced", name: "BECEd", level: "series" },
        { id: "s_beed", name: "BEEd", level: "series" },
        { id: "s_bped", name: "BPEd", level: "series" },
        { id: "s_bsed", name: "BSEd", level: "series" },
        { id: "s_bsned", name: "BSNEd", level: "series" }
      ]
    }
  ]
};

// ─── Sample Materials with all 36 metadata fields ─────────────────────────────

export interface ArchivalMaterial {
  id: string;
  uniqueId: string;           // YYiACCNNNNNNN format
  // All 36 metadata fields
  referenceCode: string | null;
  title: string | null;
  date: string | null;
  levelOfDescription: string | null;
  extentAndMedium: string | null;
  creator: string | null;
  adminBioHistory: string | null;
  archivalHistory: string | null;
  immediateSource: string | null;
  scopeContent: string | null;
  appraisal: string | null;
  accruals: string | null;
  arrangement: string | null;
  accessConditions: string | null;
  reproductionConditions: string | null;
  language: string | null;
  physicalCharacteristics: string | null;
  findingAids: string | null;
  existenceOriginals: string | null;
  existenceCopies: string | null;
  relatedUnits: string | null;
  publicationNote: string | null;
  note: string | null;
  archivistNote: string | null;
  rulesConventions: string | null;
  dateOfDescription: string | null;
  // Supplementary Dublin Core fields (non-duplicate)
  subject: string | null;
  description: string | null;
  publisher: string | null;
  contributor: string | null;
  type: string | null;
  format: string | null;
  identifier: string | null;
  source: string | null;
  relation: string | null;
  coverage: string | null;
  rights: string | null;
  // System fields
  termsOfUse: string | null;
  access: "public" | "restricted" | "confidential";
  hierarchyPath: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  sha256?: string;
  sipId?: string;
  aipId?: string;
  ingestDate?: string;
  ingestBy?: string;
  pages?: number;
  pageImages?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Material 1: 100% completion (all 36 fields filled)
const material1: ArchivalMaterial = {
  id: "2c2124e8-0a7f-468b-8946-fe0832f66940",
  uniqueId: "26iA010000001",
  referenceCode: "PH-HCDC-PUB-YB-2019",
  title: "HCDC Yearbook 2018–2019",
  date: "2019-05-01",
  levelOfDescription: "Item",
  extentAndMedium: "240 pages; application/pdf; 148.4 MB",
  creator: "HCDC Yearbook Committee",
  adminBioHistory: "The HCDC Yearbook Committee is a student-led organization responsible for documenting each graduating class.",
  archivalHistory: "Digitized from physical copy held in HCDC Archives, Box 1, Shelf A-1.",
  immediateSource: "Donated by HCDC Office of Student Affairs, January 2026.",
  scopeContent: "Comprehensive yearbook documenting the graduating class of AY 2018–2019, including student portraits, organization pages, and faculty tributes.",
  appraisal: "Retained for permanent preservation as part of institutional memory.",
  accruals: "Annual additions expected with each graduating class.",
  arrangement: "Chronological by academic year; organized by department and student organization.",
  accessConditions: "Public access; no restrictions.",
  reproductionConditions: "Educational use permitted. Attribution required. Commercial use prohibited.",
  language: "eng; fil",
  physicalCharacteristics: "Hardcover binding; good physical condition. Digitized at 300 DPI using Canon imageFORMULA DR-S150.",
  findingAids: "iArchive catalog record; HCDC Library OPAC cross-reference.",
  existenceOriginals: "Original physical copy held in HCDC Archives, Box 1, Shelf A-1.",
  existenceCopies: "Digital surrogate stored in iArchive (AIP-2026-0001). No additional copies.",
  relatedUnits: "Related to HCDC Yearbook 2017-2018 (26iA010000002) and HCDC Yearbook 2016-2017 (26iA010000003).",
  publicationNote: "Referenced in HCDC 60th Anniversary Commemorative Publication.",
  note: "Pag-abot (alternative title). Contains photography by HCDC Photography Club.",
  archivistNote: "Cataloged by M. Santos, January 2026. Verified against original.",
  rulesConventions: "ISAD(G) Second Edition, 2000; Dublin Core Metadata Element Set v1.1.",
  dateOfDescription: "2026-01-14",
  subject: "HCDC; Yearbook; Graduating Class; Davao City; Higher Education",
  description: "Comprehensive yearbook documenting the graduating class of AY 2018–2019.",
  publisher: "Holy Cross of Davao College",
  contributor: "Photography Club, HCDC",
  type: "Image; Text",
  format: "application/pdf",
  identifier: "ACC-2026-0001",
  source: "HCDC Office of Student Affairs Physical Archives",
  relation: "Part of HCDC Yearbook Series (26iA01)",
  coverage: "Davao City, Philippines; AY 2018–2019",
  rights: "Educational use permitted. Attribution required.",
  termsOfUse: "This material is available for educational and research purposes. Commercial reproduction requires written permission from HCDC.",
  access: "public",
  hierarchyPath: "HCDC > Publications > Yearbooks > Yearbook Collection",
  thumbnailUrl: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop",
  fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  pages: 240,
  pageImages: [
    "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523050854058-8df90110c476?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503676260728-1c00da094abc?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop",
  ],
  createdAt: "2026-01-14T08:00:00.000Z",
  updatedAt: "2026-03-23T17:59:14.566Z",
  createdBy: "M. Santos",
};

// Material 2: ~90% completion (32/36 fields)
const material2: ArchivalMaterial = {
  id: "16885abb-3d37-4c29-91e3-78d43332b35d",
  uniqueId: "26iA030000005",
  referenceCode: "PH-HCDC-ADM-SP-2020",
  title: "HCDC Institutional Strategic Plan 2020–2025",
  date: "2020-01-10",
  levelOfDescription: "Item",
  extentAndMedium: "120 pages; application/pdf; 5.8 MB",
  creator: "HCDC Office of the President",
  adminBioHistory: "The Office of the President provides strategic direction and governance oversight for HCDC.",
  archivalHistory: "Transferred from the Office of the President to HCDC Archives in 2026.",
  immediateSource: "Office of the President, HCDC.",
  scopeContent: "Five-year strategic plan outlining institutional goals, objectives, and key performance indicators for academic years 2020 through 2025.",
  appraisal: "Retained for permanent preservation as a key governance document.",
  accruals: "Successor plans expected every 5 years.",
  arrangement: "Organized by strategic pillar and objective area.",
  accessConditions: "Restricted to authorized HCDC personnel and accredited researchers.",
  reproductionConditions: "Reproduction for internal use only. External dissemination requires written approval.",
  language: "eng",
  physicalCharacteristics: "Softcover binding; excellent condition.",
  findingAids: "iArchive catalog; HCDC Board Secretary's index.",
  existenceOriginals: "Original held by Office of the President.",
  existenceCopies: null,
  relatedUnits: null,
  publicationNote: null,
  note: "Approved by the Board of Trustees, January 2020.",
  archivistNote: "Cataloged by M. Santos.",
  rulesConventions: "ISAD(G) Second Edition, 2000; Dublin Core v1.1.",
  dateOfDescription: "2026-01-14",
  subject: "Strategic Planning; Institutional Development; HCDC",
  description: "Five-year strategic plan outlining institutional goals, objectives, and key performance indicators.",
  publisher: "Holy Cross of Davao College",
  contributor: "HCDC Strategic Planning Committee",
  type: "Text",
  format: "application/pdf",
  identifier: null,
  source: "Office of the President Archives",
  relation: "Supersedes HCDC Strategic Plan 2015-2020",
  coverage: "HCDC, Davao City, Philippines; 2020-2025",
  rights: "Restricted. Internal use only.",
  termsOfUse: "This document is restricted to authorized HCDC personnel. Research access requires formal approval.",
  access: "restricted",
  hierarchyPath: "HCDC > Administrative Records > Strategic Plans > Institutional Plans 2020–2025",
  thumbnailUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop",
  fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  pages: 120,
  pageImages: [
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
  ],
  createdAt: "2026-01-18T08:00:00.000Z",
  updatedAt: "2026-03-23T17:59:30.545Z",
  createdBy: "M. Santos",
};

// Material 3: ~70% completion (25/36 fields)
const material3: ArchivalMaterial = {
  id: "147c850f-008d-4d33-8e8b-5c79b1ad8108",
  uniqueId: "26iA020000004",
  referenceCode: "PH-HCDC-CET-FR-2023",
  title: "Quality Education in Philippine Higher Education Institutions",
  date: "2023-09-15",
  levelOfDescription: "Item",
  extentAndMedium: "45 pages; application/pdf; 2.4 MB",
  creator: "Dr. Maria Cruz",
  adminBioHistory: null,
  archivalHistory: "Submitted to HCDC Research Repository, verified by CET Dean's Office.",
  immediateSource: "HCDC Faculty Research Team submission.",
  scopeContent: "Research paper examining quality education standards in Philippine higher education institutions, focusing on CHED compliance frameworks.",
  appraisal: "Retained as faculty scholarly output.",
  accruals: null,
  arrangement: "Organized by chapter; follows CHED format for research papers.",
  accessConditions: "Public access; open to all researchers.",
  reproductionConditions: "Educational use permitted with attribution.",
  language: "eng",
  physicalCharacteristics: null,
  findingAids: "iArchive catalog.",
  existenceOriginals: null,
  existenceCopies: null,
  relatedUnits: null,
  publicationNote: null,
  note: null,
  archivistNote: "Cataloged by M. Santos.",
  rulesConventions: "ISAD(G) Second Edition; Dublin Core v1.1.",
  dateOfDescription: "2026-01-14",
  subject: "Higher Education; Quality Assurance; Philippines; CHED",
  description: "Research paper examining quality education standards in Philippine higher education institutions.",
  publisher: "HCDC Research Institute",
  contributor: "HCDC Faculty Research Team",
  type: "Text",
  format: "application/pdf",
  identifier: null,
  source: "HCDC College of Engineering and Technology",
  relation: null,
  coverage: "Philippines; Philippine Higher Education; 2023",
  rights: "Educational use permitted with proper citation.",
  termsOfUse: "Available for educational and research use with proper citation.",
  access: "public",
  hierarchyPath: "HCDC > CET > Faculty Research > Research Papers > 2023 Faculty Publications",
  pages: 45,
  pageImages: [
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
  ],
  createdAt: "2026-01-17T08:00:00.000Z",
  updatedAt: "2026-03-23T17:59:26.589Z",
  createdBy: "M. Santos",
};

// Material 4: 50% completion (18/36 fields)
const material4: ArchivalMaterial = {
  id: "613b72de-30e9-448e-8989-5807d3bb2b6b",
  uniqueId: "26iA040000006",
  referenceCode: "PH-HCDC-BLIS-SR-2024",
  title: "Implementing E-Learning in HCDC: A Capstone Study",
  date: "2024-04-20",
  levelOfDescription: "Item",
  extentAndMedium: "89 pages; application/pdf; 3.1 MB",
  creator: "Ana Maria Reyes",
  adminBioHistory: null,
  archivalHistory: null,
  immediateSource: "Submitted by BLIS graduating student, April 2024.",
  scopeContent: "Capstone research on implementing e-learning platforms in HCDC academic programs.",
  appraisal: null,
  accruals: null,
  arrangement: null,
  accessConditions: "Public access.",
  reproductionConditions: "Educational use only. No commercial reproduction.",
  language: "eng",
  physicalCharacteristics: null,
  findingAids: null,
  existenceOriginals: null,
  existenceCopies: null,
  relatedUnits: null,
  publicationNote: null,
  note: null,
  archivistNote: "Cataloged by M. Santos.",
  rulesConventions: null,
  dateOfDescription: "2026-01-14",
  subject: "E-Learning; Educational Technology; HCDC; Capstone",
  description: "Capstone research on implementing e-learning platforms in HCDC academic programs.",
  publisher: "Holy Cross of Davao College",
  contributor: "BLIS Department Adviser",
  type: "Text",
  format: "application/pdf",
  identifier: null,
  source: null,
  relation: null,
  coverage: null,
  rights: null,
  termsOfUse: null,
  access: "public",
  hierarchyPath: "HCDC > BLIS > Student Research > Capstone Projects > 2024 Capstone Projects",
  pages: 89,
  pageImages: [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=800&auto=format&fit=crop",
  ],
  createdAt: "2026-01-19T08:00:00.000Z",
  updatedAt: "2026-03-23T17:59:34.512Z",
  createdBy: "M. Santos",
};

// Material 5: ~33% completion (12/36 fields)
const material5: ArchivalMaterial = {
  id: "9eaed59e-5647-43f5-9611-1021c2190688",
  uniqueId: "26iA030000008",
  referenceCode: "PH-HCDC-ADM-BM-2022",
  title: "HCDC Board of Trustees Minutes 2022",
  date: "2022-12-31",
  levelOfDescription: "Item",
  extentAndMedium: "58 pages; application/pdf; 1.2 MB",
  creator: "HCDC Board of Trustees",
  adminBioHistory: null,
  archivalHistory: null,
  immediateSource: null,
  scopeContent: null,
  appraisal: null,
  accruals: null,
  arrangement: null,
  accessConditions: "Confidential. Board authorization required.",
  reproductionConditions: null,
  language: "eng",
  physicalCharacteristics: null,
  findingAids: null,
  existenceOriginals: null,
  existenceCopies: null,
  relatedUnits: null,
  publicationNote: null,
  note: null,
  archivistNote: null,
  rulesConventions: null,
  dateOfDescription: null,
  subject: "Board Minutes; Governance; HCDC",
  description: "Official minutes of the Board of Trustees meetings for calendar year 2022.",
  publisher: "Holy Cross of Davao College",
  contributor: null,
  type: "Text",
  format: "application/pdf",
  identifier: null,
  source: null,
  relation: null,
  coverage: null,
  rights: null,
  termsOfUse: "Strictly confidential. Access requires Board authorization.",
  access: "confidential",
  hierarchyPath: "HCDC > Administrative Records > Board Minutes > Board Minutes 2022",
  pages: 58,
  pageImages: [
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542744173-05336fcc7ad4?q=80&w=800&auto=format&fit=crop",
  ],
  createdAt: "2026-01-21T08:00:00.000Z",
  updatedAt: "2026-03-23T17:59:42.230Z",
  createdBy: "M. Santos",
};

// Material 6: ~17% completion (6/36 fields)
const material6: ArchivalMaterial = {
  id: "b7a5a08c-ea62-4601-8b35-0ee6ff90d796",
  uniqueId: "26iA050000007",
  referenceCode: null,
  title: "HCDC Campus Historic Photos 1960–1990",
  date: "1990-12-31",
  levelOfDescription: null,
  extentAndMedium: null,
  creator: "HCDC Archives",
  adminBioHistory: null,
  archivalHistory: null,
  immediateSource: null,
  scopeContent: null,
  appraisal: null,
  accruals: null,
  arrangement: null,
  accessConditions: null,
  reproductionConditions: null,
  language: null,
  physicalCharacteristics: null,
  findingAids: null,
  existenceOriginals: null,
  existenceCopies: null,
  relatedUnits: null,
  publicationNote: null,
  note: null,
  archivistNote: null,
  rulesConventions: null,
  dateOfDescription: null,
  subject: "Campus; Historic Photographs; HCDC; Davao",
  description: "Collection of historical photographs documenting HCDC campus life from 1960 to 1990.",
  publisher: null,
  contributor: null,
  type: null,
  format: "image/tiff",
  identifier: null,
  source: null,
  relation: null,
  coverage: null,
  rights: null,
  termsOfUse: null,
  access: "public",
  hierarchyPath: "HCDC > Photographs > Historic Photos > Campus Photos 1960–1990",
  pages: 48,
  pageImages: [
    "https://images.unsplash.com/photo-1564429238961-bf8f57dbfa2b?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1569974498991-d3c12a504f95?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497375638960-ca368c7231e4?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=800&auto=format&fit=crop",
  ],
  createdAt: "2026-01-20T08:00:00.000Z",
  updatedAt: "2026-03-23T17:59:38.439Z",
  createdBy: "M. Santos",
};

export const SAMPLE_MATERIALS: ArchivalMaterial[] = [
  material1,
  material2,
  material3,
  material4,
  material5,
  material6,
];

// ─── Activity Log ─────────────────────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  timestamp: string;
  user: string;
  actionType: "upload" | "edit" | "metadata_update" | "access_change" | "delete";
  description: string;
  materialId?: string;
}

export const ACTIVITY_FEED: ActivityEntry[] = [
  { id: "act-1", timestamp: "2026-03-23T17:59:42Z", user: "M. Santos", actionType: "upload", description: "Uploaded 'HCDC Board of Trustees Minutes 2022'", materialId: "26iA030000008" },
  { id: "act-2", timestamp: "2026-03-23T17:59:38Z", user: "M. Santos", actionType: "upload", description: "Uploaded 'HCDC Campus Historic Photos 1960–1990'", materialId: "26iA050000007" },
  { id: "act-3", timestamp: "2026-03-23T17:59:34Z", user: "M. Santos", actionType: "upload", description: "Uploaded 'Implementing E-Learning in HCDC'", materialId: "26iA040000006" },
  { id: "act-4", timestamp: "2026-03-23T17:59:30Z", user: "M. Santos", actionType: "metadata_update", description: "Updated metadata for 'HCDC Institutional Strategic Plan' — 32 fields completed", materialId: "26iA030000005" },
  { id: "act-5", timestamp: "2026-03-23T17:59:26Z", user: "M. Santos", actionType: "metadata_update", description: "Updated metadata for 'Quality Education in Philippine HEIs' — 25 fields completed", materialId: "26iA020000004" },
  { id: "act-6", timestamp: "2026-03-23T17:59:14Z", user: "M. Santos", actionType: "metadata_update", description: "Completed full metadata cataloging for 'HCDC Yearbook 2018–2019' — 36/36 fields", materialId: "26iA010000001" },
  { id: "act-7", timestamp: "2026-03-22T10:30:00Z", user: "Admin", actionType: "access_change", description: "Changed access level of 'Board of Trustees Minutes 2022' to Confidential", materialId: "26iA030000008" },
  { id: "act-8", timestamp: "2026-03-21T14:15:00Z", user: "M. Santos", actionType: "edit", description: "Edited title of 'HCDC Yearbook 2018–2019' (added alternative title 'Pag-abot')", materialId: "26iA010000001" },
  { id: "act-9", timestamp: "2026-03-20T09:00:00Z", user: "Admin", actionType: "upload", description: "Initialized archival hierarchy structure for HCDC Fonds" },
  { id: "act-10", timestamp: "2026-03-19T16:45:00Z", user: "M. Santos", actionType: "metadata_update", description: "Applied ISAD(G) metadata checklist to Yearbook series" },
];
