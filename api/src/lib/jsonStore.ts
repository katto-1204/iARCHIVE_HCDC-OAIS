import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateId, generateMaterialId } from "./id.js";
import bcrypt from "bcryptjs";

// Ensure bcryptjs works correctly in ESM/CommonJS contexts
const hashSync = (bcrypt as any).default?.hashSync || bcrypt.hashSync;

type JsonCategory = {
  id: string;
  name: string;
  description?: string | null;
  category_no: number;
  level: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
};

type JsonMaterial = {
  id: string;
  material_id: string;
  title: string;
  alt_title?: string | null;
  creator?: string | null;
  description?: string | null;
  date?: string | null;
  category_id?: string | null;
  access: "public" | "restricted" | "confidential";
  format?: string | null;
  file_size?: string | null;
  pages?: number | null;
  language?: string | null;
  publisher?: string | null;
  contributor?: string | null;
  subject?: string | null;
  type?: string | null;
  source?: string | null;
  rights?: string | null;
  relation?: string | null;
  coverage?: string | null;
  identifier?: string | null;
  archival_history?: string | null;
  custodial_history?: string | null;
  accession_no?: string | null;
  scope_content?: string | null;
  arrangement?: string | null;
  sha256?: string | null;
  scanner?: string | null;
  resolution?: string | null;
  physical_location?: string | null;
  physical_condition?: string | null;
  binding_type?: string | null;
  cataloger?: string | null;
  date_cataloged?: string | null;
  sip_id?: string | null;
  aip_id?: string | null;
  ingest_date?: string | null;
  ingest_by?: string | null;
  fixity_status?: string | null;
  preferred_citation?: string | null;
  file_url?: string | null;
  thumbnail_url?: string | null;
  status: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};

type JsonUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  userCategory?: string | null;
  institution?: string | null;
  purpose?: string | null;
  status: "pending" | "active" | "inactive" | "rejected";
  createdAt: string;
  updatedAt?: string;
};

type JsonUserCopyRecord = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  user_category?: string | null;
  institution?: string | null;
  purpose?: string | null;
  status: "pending" | "active" | "inactive" | "rejected";
  created_at: string;
  updated_at?: string;
};

type JsonAccessRequest = {
  id: string;
  materialId: string;
  userId: string;
  purpose: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
};

const DEMO_USERS = [
  { id: "demo-admin", name: "Demo Admin", email: "admin@hcdc.edu.ph", role: "admin", userCategory: "administrator", institution: "HCDC", status: "active" as const },
  { id: "demo-archivist", name: "Demo Archivist", email: "archivist@hcdc.edu.ph", role: "archivist", userCategory: "staff", institution: "HCDC", status: "active" as const },
  { id: "demo-student", name: "Demo Student", email: "student@hcdc.edu.ph", role: "student", userCategory: "student", institution: "HCDC", status: "active" as const },
] as const;

function getDemoUserByEmail(email?: string) {
  return DEMO_USERS.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
}

function getDemoUserById(id?: string) {
  return DEMO_USERS.find((u) => u.id === id);
}

const isVercel = process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;
const DATA_BASE = isVercel ? "/tmp" : process.cwd();

// ─── Seed from project root on Vercel cold start ───────────────────────────
// On Vercel, /tmp is empty on cold starts. We need to seed it from the project
// root JSON files that are bundled alongside the serverless function.
function seedVercelTmp() {
  if (!isVercel) return;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Try multiple possible locations for the source JSON files
  const possibleRoots = [
    process.cwd(),                                      // Vercel function CWD
    path.resolve(__dirname, "..", "..", ".."),            // api/src/lib -> api root -> project root
    path.resolve(__dirname, "..", "..", "..", ".."),      // one more level up
  ];

  const filesToSeed = [
    "categories.json",
    "materials.json",
    "users.json",
    "users copy.json",
    "access_requests.json",
  ];

  for (const fileName of filesToSeed) {
    const destPath = path.join("/tmp", fileName);
    if (fs.existsSync(destPath)) continue; // Already seeded

    for (const root of possibleRoots) {
      const srcPath = path.join(root, fileName);
      try {
        if (fs.existsSync(srcPath)) {
          const data = fs.readFileSync(srcPath, "utf8");
          fs.writeFileSync(destPath, data, "utf8");
          console.log(`Seeded /tmp/${fileName} from ${srcPath}`);
          break;
        }
      } catch {
        // Continue to next possible root
      }
    }
  }
}

// Run seed on module load
seedVercelTmp();

const CATEGORIES_PATH = path.join(DATA_BASE, "categories.json");
const MATERIALS_PATH = path.join(DATA_BASE, "materials.json");
const USERS_PATH = path.join(DATA_BASE, "users.json");
const USERS_COPY_PATH = path.join(DATA_BASE, "users copy.json");
const ACCESS_REQUESTS_PATH = path.join(DATA_BASE, "access_requests.json");

function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(filePath: string, value: unknown) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  } catch (error: any) {
    // On Vercel (read-only), we purely log and continue to let the app function in-memory
    console.warn(`Could not save to ${filePath}:`, error.message);
  }
}

function safeReadUserCopyRecords(): JsonUserCopyRecord[] {
  return safeReadJson<JsonUserCopyRecord[]>(USERS_COPY_PATH, []);
}

function safeWriteUserCopyRecords(records: JsonUserCopyRecord[]) {
  safeWriteJson(USERS_COPY_PATH, records);
}

function mapUserCopyRecordToJsonUser(rec: JsonUserCopyRecord): JsonUser {
  return {
    id: rec.id,
    name: rec.name,
    email: rec.email,
    passwordHash: rec.password_hash,
    role: rec.role,
    userCategory: rec.user_category ?? null,
    institution: rec.institution ?? null,
    purpose: rec.purpose ?? null,
    status: rec.status,
    createdAt: rec.created_at,
    updatedAt: rec.updated_at,
  };
}

function getCategoryLevelName(level: string) {
  // Mirror API-level values; fallback to fonds.
  const allowed = new Set(["fonds", "subfonds", "series", "file", "item"]);
  return allowed.has(level) ? level : "fonds";
}

function materialSeqFromMaterialId(materialId: string) {
  // Example: 26iA020000004
  const m = materialId.match(/^(\d{2})iA(\d{2})(\d{7})$/);
  if (!m) return null;
  return Number(m[3]);
}

function toCategoryResponse(cat: JsonCategory & { materialCount?: number }) {
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description ?? null,
    categoryNo: Number(cat.category_no),
    level: getCategoryLevelName(cat.level),
    parentId: cat.parent_id ?? null,
    materialCount: Number(cat.materialCount ?? 0),
    createdAt: cat.created_at,
  } as const;
}

function mapMaterialListing(m: JsonMaterial, categoryName?: string | null) {
  return {
    id: m.id,
    materialId: m.material_id,
    title: m.title,
    altTitle: m.alt_title ?? null,
    creator: m.creator ?? null,
    description: m.description ?? null,
    date: m.date ?? null,
    categoryId: m.category_id ?? null,
    categoryName: categoryName ?? null,
    access: m.access,
    format: m.format ?? null,
    fileSize: m.file_size ?? null,
    pages: m.pages ?? null,
    language: m.language ?? null,
    publisher: m.publisher ?? null,
    status: m.status,
    thumbnailUrl: m.thumbnail_url ?? null,
    createdAt: m.created_at,
    createdBy: m.created_by ?? null,
  };
}

function mapMaterialDetail(m: JsonMaterial, categoryName?: string | null, relatedItems?: JsonMaterial[]) {
  return {
    id: m.id,
    materialId: m.material_id,
    title: m.title,
    altTitle: m.alt_title ?? null,
    creator: m.creator ?? null,
    description: m.description ?? null,
    date: m.date ?? null,
    categoryId: m.category_id ?? null,
    categoryName: categoryName ?? null,
    access: m.access,
    format: m.format ?? null,
    fileSize: m.file_size ?? null,
    pages: m.pages ?? null,
    language: m.language ?? null,
    publisher: m.publisher ?? null,
    status: m.status,
    thumbnailUrl: m.thumbnail_url ?? null,
    createdAt: m.created_at,
    createdBy: m.created_by ?? null,

    contributor: m.contributor ?? null,
    subject: m.subject ?? null,
    type: m.type ?? null,
    source: m.source ?? null,
    rights: m.rights ?? null,
    relation: m.relation ?? null,
    coverage: m.coverage ?? null,
    identifier: m.identifier ?? null,
    archivalHistory: m.archival_history ?? null,
    custodialHistory: m.custodial_history ?? null,
    accessionNo: m.accession_no ?? null,
    scopeContent: m.scope_content ?? null,
    arrangement: m.arrangement ?? null,
    sha256: m.sha256 ?? null,
    scanner: m.scanner ?? null,
    resolution: m.resolution ?? null,
    physicalLocation: m.physical_location ?? null,
    physicalCondition: m.physical_condition ?? null,
    bindingType: m.binding_type ?? null,
    cataloger: m.cataloger ?? null,
    dateCataloged: m.date_cataloged ?? null,
    sipId: m.sip_id ?? null,
    aipId: m.aip_id ?? null,
    ingestDate: m.ingest_date ?? null,
    ingestBy: m.ingest_by ?? null,
    fixityStatus: m.fixity_status ?? null,
    preferredCitation: m.preferred_citation ?? null,
    fileUrl: m.file_url ?? null,

    relatedItems: (relatedItems ?? []).map((ri) => ({
      ...mapMaterialListing(ri, undefined),
    })),
  };
}

export function jsonStoreGetCategories() {
  const categories = safeReadJson<JsonCategory[]>(CATEGORIES_PATH, []);
  const materials = safeReadJson<JsonMaterial[]>(MATERIALS_PATH, []);
  const counts: Record<string, number> = {};
  for (const m of materials) {
    const cid = m.category_id ?? null;
    if (!cid) continue;
    counts[cid] = (counts[cid] ?? 0) + 1;
  }
  return categories
    .slice()
    .sort((a, b) => Number(a.category_no) - Number(b.category_no))
    .map((c) => toCategoryResponse({ ...c, materialCount: counts[c.id] ?? 0 }));
}

export function jsonStoreCreateCategory(input: {
  name: string;
  description?: string | null;
  level: string;
  parentId?: string | null;
}) {
  const now = new Date().toISOString();
  const categories = safeReadJson<JsonCategory[]>(CATEGORIES_PATH, []);
  const maxNo = categories.reduce((acc, c) => Math.max(acc, Number(c.category_no) || 0), 0);
  const category_no = maxNo + 1;
  const id = generateId();
  const cat: JsonCategory = {
    id,
    name: input.name,
    description: input.description ?? null,
    category_no,
    level: input.level,
    parent_id: input.parentId ?? null,
    created_at: now,
    updated_at: now,
  };
  categories.push(cat);
  safeWriteJson(CATEGORIES_PATH, categories);
  return toCategoryResponse({ ...cat, materialCount: 0 });
}

export function jsonStoreUpdateCategory(input: {
  id: string;
  name?: string;
  description?: string | null;
  level?: string;
  parentId?: string | null;
}) {
  const categories = safeReadJson<JsonCategory[]>(CATEGORIES_PATH, []);
  const idx = categories.findIndex((c) => c.id === input.id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const current = categories[idx];
  const updated: JsonCategory = {
    ...current,
    name: input.name ?? current.name,
    description: input.description ?? current.description ?? null,
    level: input.level ?? current.level,
    parent_id: input.parentId ?? current.parent_id ?? null,
    updated_at: now,
  };
  categories[idx] = updated;
  safeWriteJson(CATEGORIES_PATH, categories);
  return toCategoryResponse({ ...updated, materialCount: 0 });
}

export function jsonStoreDeleteCategory(id: string) {
  const categories = safeReadJson<JsonCategory[]>(CATEGORIES_PATH, []);
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  categories.splice(idx, 1);
  safeWriteJson(CATEGORIES_PATH, categories);

  // Mirror DB route comment: materials in this category become uncategorized.
  const materials = safeReadJson<JsonMaterial[]>(MATERIALS_PATH, []);
  let changed = false;
  for (const m of materials) {
    if ((m.category_id ?? null) === id) {
      m.category_id = null;
      changed = true;
    }
  }
  if (changed) safeWriteJson(MATERIALS_PATH, materials);
  return true;
}

export function jsonStoreGetMaterials(params: {
  search?: string;
  access?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  const categories = safeReadJson<JsonCategory[]>(CATEGORIES_PATH, []);
  const catMap: Record<string, string> = Object.fromEntries(
    categories.map((c) => [c.id, c.name]),
  );

  const materials = safeReadJson<JsonMaterial[]>(MATERIALS_PATH, []);
  const search = (params.search ?? "").trim().toLowerCase();
  const access = params.access?.trim();
  const categoryId = params.category?.trim();

  const filtered = materials
    .filter((m) => !m.status || m.status === "published")
    .filter((m) => {
      if (!search) return true;
      return (
        (m.title ?? "").toLowerCase().includes(search) ||
        (m.material_id ?? "").toLowerCase().includes(search) ||
        (m.creator ?? "").toLowerCase().includes(search) ||
        (m.description ?? "").toLowerCase().includes(search)
      );
    })
    .filter((m) => {
      if (!access) return true;
      return m.access === access;
    })
    .filter((m) => {
      if (!categoryId) return true;
      return (m.category_id ?? null) === categoryId;
    })
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(1000, params.limit ?? 50);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  return {
    materials: filtered.slice(offset, offset + limit).map((m) => mapMaterialListing(m, m.category_id ? catMap[m.category_id] : null)),
    total,
    page,
    limit,
    totalPages,
  };
}

export function jsonStoreGetMaterial(id: string) {
  const categories = safeReadJson<JsonCategory[]>(CATEGORIES_PATH, []);
  const catMap: Record<string, string> = Object.fromEntries(
    categories.map((c) => [c.id, c.name]),
  );
  const materials = safeReadJson<JsonMaterial[]>(MATERIALS_PATH, []);

  const m = materials.find((x) => x.id === id || x.material_id === id);
  if (!m) return null;

  const related = m.category_id
    ? materials
      .filter((x) => (x.category_id ?? null) === m.category_id && x.id !== m.id)
      .slice(0, 4)
    : [];

  const detail = mapMaterialDetail(
    m,
    m.category_id ? catMap[m.category_id] : null,
    [],
  );

  return {
    ...detail,
    relatedItems: related.map((ri) =>
      mapMaterialListing(ri, ri.category_id ? catMap[ri.category_id] : null),
    ),
  };
}

export function jsonStoreCreateMaterial(input: {
  data: any;
  user: { userId: string; name: string };
}) {
  const { data, user } = input;
  const now = new Date().toISOString();

  const categories = safeReadJson<JsonCategory[]>(CATEGORIES_PATH, []);
  const materials = safeReadJson<JsonMaterial[]>(MATERIALS_PATH, []);
  const cat = data.categoryId ? categories.find((c) => c.id === data.categoryId) : categories[0];
  const catNo = cat ? Number(cat.category_no) : 1;

  const inCat = materials.filter((m) => (m.category_id ?? null) === (data.categoryId ?? (cat?.id ?? null)));
  const maxSeq = inCat.reduce((acc, m) => {
    const seq = materialSeqFromMaterialId(m.material_id);
    return seq == null ? acc : Math.max(acc, seq);
  }, 0);
  const seqNo = maxSeq + 1;

  const materialId = generateMaterialId(catNo, seqNo);
  const year = new Date().getFullYear();
  const sipId = `SIP-${year}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${String(seqNo).padStart(3, "0")}`;
  const aipId = `AIP-${year}-${String(seqNo).padStart(4, "0")}`;
  const ingestDate = new Date().toISOString().split("T")[0];
  const cataloger = user.name;
  const dateCataloged = ingestDate;
  const preferredCitation =
    data.preferredCitation ||
    `${data.creator || "Author"}. (${data.date?.split("-")[0] || new Date().getFullYear()}). ${data.title}. Holy Cross of Davao College. [${materialId}]`;

  const id = generateId();
  const newMat: JsonMaterial = {
    id,
    material_id: materialId,
    title: data.title,
    alt_title: data.altTitle ?? null,
    creator: data.creator ?? null,
    description: data.description ?? null,
    date: data.date ?? null,
    category_id: data.categoryId ?? cat?.id ?? null,
    access: data.access,
    format: data.format ?? null,
    file_size: data.fileSize ?? null,
    pages: data.pages ?? null,
    language: data.language ?? null,
    publisher: data.publisher ?? null,
    contributor: data.contributor ?? null,
    subject: data.subject ?? null,
    type: data.type ?? null,
    source: data.source ?? null,
    rights: data.rights ?? null,
    relation: data.relation ?? null,
    coverage: data.coverage ?? null,
    identifier: data.identifier ?? null,
    archival_history: data.archivalHistory ?? null,
    custodial_history: data.custodialHistory ?? null,
    accession_no: data.accessionNo ?? null,
    scope_content: data.scopeContent ?? null,
    arrangement: data.arrangement ?? null,
    sha256: data.sha256 ?? null,
    scanner: data.scanner ?? null,
    resolution: data.resolution ?? null,
    physical_location: data.physicalLocation ?? null,
    physical_condition: data.physicalCondition ?? null,
    binding_type: data.bindingType ?? null,
    cataloger,
    date_cataloged: dateCataloged,
    sip_id: data.sipId ?? sipId,
    aip_id: data.aipId ?? aipId,
    ingest_date: ingestDate,
    ingest_by: user.name,
    fixity_status: data.sha256 ? "verified" : null,
    preferred_citation: preferredCitation ?? null,
    file_url: data.fileUrl ?? null,
    thumbnail_url: data.thumbnailUrl ?? null,
    status: "published",
    created_by: user.userId,
    created_at: now,
    updated_at: now,
  };

  materials.push(newMat);
  safeWriteJson(MATERIALS_PATH, materials);

  const catName = newMat.category_id ? categories.find((c) => c.id === newMat.category_id)?.name : undefined;
  return mapMaterialDetail(newMat, catName ?? null, []);
}

export function jsonStoreUpdateMaterial(id: string, data: any, user: { userId: string; name: string }) {
  const categories = safeReadJson<JsonCategory[]>(CATEGORIES_PATH, []);
  const materials = safeReadJson<JsonMaterial[]>(MATERIALS_PATH, []);
  const idx = materials.findIndex((m) => m.id === id || m.material_id === id);
  if (idx === -1) return null;
  const current = materials[idx];
  const updatedAt = new Date().toISOString();
  const next: JsonMaterial = {
    ...current,
    title: data.title ?? current.title,
    alt_title: data.altTitle ?? current.alt_title ?? null,
    creator: data.creator ?? current.creator ?? null,
    description: data.description ?? current.description ?? null,
    date: data.date ?? current.date ?? null,
    category_id: data.categoryId !== undefined ? data.categoryId : current.category_id,
    access: data.access ?? current.access,
    format: data.format ?? current.format ?? null,
    file_size: data.fileSize ?? current.file_size ?? null,
    file_url: data.fileUrl !== undefined ? data.fileUrl : current.file_url ?? null,
    thumbnail_url: data.thumbnailUrl !== undefined ? data.thumbnailUrl : current.thumbnail_url ?? null,
    pages: data.pages ?? current.pages ?? null,
    language: data.language ?? current.language ?? null,
    publisher: data.publisher ?? current.publisher ?? null,
    status: data.status ?? current.status,
    updated_at: updatedAt,
  };
  materials[idx] = next;
  safeWriteJson(MATERIALS_PATH, materials);
  const catName = next.category_id ? categories.find((c) => c.id === next.category_id)?.name : undefined;
  return mapMaterialDetail(next, catName ?? null, []);
}

export function jsonStoreDeleteMaterial(id: string) {
  const materials = safeReadJson<JsonMaterial[]>(MATERIALS_PATH, []);
  const idx = materials.findIndex((m) => m.id === id || m.material_id === id);
  if (idx === -1) return false;
  materials.splice(idx, 1);
  safeWriteJson(MATERIALS_PATH, materials);
  return true;
}

export function jsonStoreGetStats() {
  const categories = safeReadJson<JsonCategory[]>(CATEGORIES_PATH, []);
  const materials = safeReadJson<JsonMaterial[]>(MATERIALS_PATH, []);
  const users = safeReadJson<JsonUser[]>(USERS_PATH, []);
  return {
    totalMaterials: materials.filter((m) => !m.status || m.status === "published").length,
    totalCategories: categories.length,
    totalUsers: Math.max(3, users.length),
    pendingRequests: 0,
    pendingUsers: 0,
    recentActivity: [],
  };
}

export function jsonStoreGetUserByEmail(email: string) {
  const users = safeReadJson<JsonUser[]>(USERS_PATH, []);
  if (!email) return null;
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return existing;

  const usersCopy = safeReadUserCopyRecords();
  const existingCopy = usersCopy.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingCopy) return mapUserCopyRecordToJsonUser(existingCopy);

  const demo = getDemoUserByEmail(email);
  if (!demo) return null;
  return {
    id: demo.id,
    name: demo.name,
    email: demo.email,
    role: demo.role,
    userCategory: demo.userCategory,
    institution: demo.institution,
    purpose: null,
    status: demo.status,
    createdAt: new Date().toISOString(),
    passwordHash: "",
  };
}

export function jsonStoreGetUserById(id: string) {
  const users = safeReadJson<JsonUser[]>(USERS_PATH, []);
  const existing = users.find((u) => u.id === id);
  if (existing) return existing;

  const usersCopy = safeReadUserCopyRecords();
  const existingCopy = usersCopy.find((u) => u.id === id);
  if (existingCopy) return mapUserCopyRecordToJsonUser(existingCopy);

  const demo = getDemoUserById(id);
  if (!demo) return null;
  return {
    id: demo.id,
    name: demo.name,
    email: demo.email,
    role: demo.role,
    userCategory: demo.userCategory,
    institution: demo.institution,
    purpose: null,
    status: demo.status,
    createdAt: new Date().toISOString(),
    passwordHash: "",
  };
}

export function jsonStoreUpdateUserProfile(id: string, updates: { name?: string; institution?: string; purpose?: string }) {
  const users = safeReadJson<JsonUser[]>(USERS_PATH, []);
  const index = users.findIndex((u: any) => u.id === id);
  if (index === -1) return null;

  if (updates.name) users[index].name = updates.name;
  if (updates.institution !== undefined) users[index].institution = updates.institution;
  if (updates.purpose !== undefined) users[index].purpose = updates.purpose;
  users[index].updatedAt = new Date().toISOString();

  safeWriteJson(USERS_PATH, users);
  return users[index];
}

export function jsonStoreRegisterUser(input: {
  name: string;
  email: string;
  password?: string;
  role: string;
  userCategory?: string;
  institution?: string;
  purpose?: string;
}) {
  const users = safeReadJson<JsonUser[]>(USERS_PATH, []);
  const existing = users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    return { ok: false, error: "Email already registered" as const };
  }

  const now = new Date().toISOString();
  const passwordHash = input.password ? hashSync(input.password, 12) : "";
  const id = generateId();
  const user: JsonUser = {
    id,
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    userCategory: input.userCategory || input.role,
    institution: input.institution || null,
    purpose: input.purpose || null,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  safeWriteJson(USERS_PATH, users);
  return { ok: true, userId: id };
}

export function jsonStoreGetUsers(params: { status?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const usersJson = safeReadJson<JsonUser[]>(USERS_PATH, []);
  const usersCopy = safeReadUserCopyRecords().map(mapUserCopyRecordToJsonUser);
  const users = Array.from(new Map([...usersJson, ...usersCopy].map((u) => [u.id, u])).values());
  let filtered = users.slice();
  if (params.status && ["pending", "active", "inactive", "rejected"].includes(params.status)) {
    filtered = filtered.filter((u) => u.status === params.status);
  }
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const pageUsers = filtered.slice(offset, offset + limit);
  return {
    users: pageUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      userCategory: u.userCategory,
      institution: u.institution,
      purpose: u.purpose,
      status: u.status,
      createdAt: u.createdAt,
    })),
    total,
    page,
    totalPages,
  };
}

export function jsonStoreApproveUser(id: string) {
  const users = safeReadJson<JsonUser[]>(USERS_PATH, []);
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx].status = "active";
    users[idx].updatedAt = new Date().toISOString();
    safeWriteJson(USERS_PATH, users);
    return true;
  }

  const usersCopy = safeReadUserCopyRecords();
  const copyIdx = usersCopy.findIndex((u) => u.id === id);
  if (copyIdx === -1) return false;
  usersCopy[copyIdx].status = "active";
  usersCopy[copyIdx].updated_at = new Date().toISOString();
  safeWriteUserCopyRecords(usersCopy);
  return true;
}

export function jsonStoreRejectUser(id: string) {
  const users = safeReadJson<JsonUser[]>(USERS_PATH, []);
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx].status = "rejected";
    users[idx].updatedAt = new Date().toISOString();
    safeWriteJson(USERS_PATH, users);
    return true;
  }

  const usersCopy = safeReadUserCopyRecords();
  const copyIdx = usersCopy.findIndex((u) => u.id === id);
  if (copyIdx === -1) return false;
  usersCopy[copyIdx].status = "rejected";
  usersCopy[copyIdx].updated_at = new Date().toISOString();
  safeWriteUserCopyRecords(usersCopy);
  return true;
}

export function jsonStoreDeleteUser(id: string) {
  const users = safeReadJson<JsonUser[]>(USERS_PATH, []);
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users.splice(idx, 1);
    safeWriteJson(USERS_PATH, users);
    return true;
  }

  const usersCopy = safeReadUserCopyRecords();
  const copyIdx = usersCopy.findIndex((u) => u.id === id);
  if (copyIdx === -1) return false;
  usersCopy.splice(copyIdx, 1);
  safeWriteUserCopyRecords(usersCopy);
  return true;
}

export function jsonStoreGetAccessRequests(params: {
  status?: string;
  userId?: string;
  role?: string;
  page?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const accessRequests = safeReadJson<JsonAccessRequest[]>(ACCESS_REQUESTS_PATH, []);
  const users = safeReadJson<JsonUser[]>(USERS_PATH, []);
  const usersCopy = safeReadUserCopyRecords().map(mapUserCopyRecordToJsonUser);
  const materials = safeReadJson<JsonMaterial[]>(MATERIALS_PATH, []);

  const allowedSelfRoles = ["student", "researcher", "alumni", "public"];
  let filtered = accessRequests.slice();

  if (params.status && ["pending", "approved", "rejected"].includes(params.status)) {
    filtered = filtered.filter((r) => r.status === params.status);
  }

  if (params.role && allowedSelfRoles.includes(params.role) && params.userId) {
    filtered = filtered.filter((r) => r.userId === params.userId);
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const pageItems = filtered.slice(offset, offset + limit);

  const allUsers = Array.from(new Map([...users, ...usersCopy].map((u) => [u.id, u])).values());

  return {
    requests: pageItems.map((req) => {
      const u = allUsers.find((x) => x.id === req.userId) || getDemoUserById(req.userId);
      const mat = materials.find((m) => m.id === req.materialId || m.material_id === req.materialId);
      return {
        id: req.id,
        materialId: req.materialId,
        materialTitle: mat?.title || "Unknown Material",
        userId: req.userId,
        userName: u?.name || "Unknown",
        userEmail: u?.email || "Unknown",
        purpose: req.purpose,
        status: req.status,
        rejectionReason: req.rejectionReason,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    }),
    total,
    page,
    totalPages,
  };
}

export function jsonStoreSubmitAccessRequest(input: {
  materialId: string;
  purpose: string;
  userId: string;
  userName: string;
}) {
  const accessRequests = safeReadJson<JsonAccessRequest[]>(ACCESS_REQUESTS_PATH, []);
  const now = new Date().toISOString();
  const id = generateId();
  const newReq: JsonAccessRequest = {
    id,
    materialId: input.materialId,
    userId: input.userId,
    purpose: input.purpose,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  accessRequests.push(newReq);
  safeWriteJson(ACCESS_REQUESTS_PATH, accessRequests);

  const materials = safeReadJson<JsonMaterial[]>(MATERIALS_PATH, []);
  const mat = materials.find((m) => m.id === input.materialId || m.material_id === input.materialId);

  return {
    id,
    materialId: input.materialId,
    materialTitle: mat?.title || "Unknown Material",
    userId: input.userId,
    userName: input.userName,
    userEmail: "",
    purpose: input.purpose,
    status: "pending" as const,
    createdAt: now,
    updatedAt: now,
  };
}

export function jsonStoreApproveAccessRequest(id: string) {
  const accessRequests = safeReadJson<JsonAccessRequest[]>(ACCESS_REQUESTS_PATH, []);
  const idx = accessRequests.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  accessRequests[idx].status = "approved";
  accessRequests[idx].updatedAt = new Date().toISOString();
  safeWriteJson(ACCESS_REQUESTS_PATH, accessRequests);
  return true;
}

export function jsonStoreRejectAccessRequest(input: { id: string; reason?: string }) {
  const accessRequests = safeReadJson<JsonAccessRequest[]>(ACCESS_REQUESTS_PATH, []);
  const idx = accessRequests.findIndex((r) => r.id === input.id);
  if (idx === -1) return false;
  accessRequests[idx].status = "rejected";
  accessRequests[idx].rejectionReason = input.reason || null;
  accessRequests[idx].updatedAt = new Date().toISOString();
  safeWriteJson(ACCESS_REQUESTS_PATH, accessRequests);
  return true;
}
