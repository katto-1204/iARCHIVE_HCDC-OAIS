# 📦 iArchive — HCDC Digital Archival Collection System

> **OAIS-compliant** digital repository for Holy Cross of Davao College (HCDC), built to preserve, organize, and provide controlled access to institutional records and research materials.

---

## 🌟 Overview

iArchive is a full-stack web application that serves as HCDC's official digital archive. It implements international archival standards including **OAIS (ISO 14721:2012)**, **ISAD(G)**, and **Dublin Core** metadata.

### Key Features
- **Full-Text Search** — Search across all metadata fields, identifiers, and Dublin Core elements
- **ISAD(G) Metadata** — Full compliance with international archival description standards
- **Role-Based Access Control** — Granular permissions: Public, Restricted, Confidential
- **Access Request Workflow** — Researchers petition for restricted material access
- **Audit Logging** — Every action recorded with full traceability
- **Preservation Integrity** — SHA-256 fixity checks and OAIS-compliant AIP generation

---

## 🏗 Architecture

```
iarchive/           ← Frontend (React + Vite + TypeScript)
├── src/
│   ├── pages/      ← Route pages (Home, Login, Collections, Admin, etc.)
│   ├── components/ ← Reusable UI components
│   ├── hooks/      ← Custom React hooks
│   └── lib/        ← Utilities
├── public/         ← Static assets (logos, images)
└── vite.config.ts  ← Vite config with API proxy

api-server/         ← Backend (Express + TypeScript)
├── src/
│   ├── routes/     ← API route handlers
│   ├── lib/        ← Auth, JSON store, utilities
│   └── middlewares/← Auth middleware
└── package.json

lib/
├── db/             ← Drizzle ORM schema (PostgreSQL)
├── api-client-react/ ← Generated typed API hooks
├── api-spec/       ← API specification
└── api-zod/        ← Zod validation schemas
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **pnpm** package manager

### Install Dependencies
```bash
pnpm install
```

### Start Development (Frontend + API)
```bash
# Terminal 1: Start API server (port 5000)
cd artifacts/api-server
pnpm run build && pnpm run start

# Terminal 2: Start frontend (port 5173)
cd artifacts/iarchive
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Demo Credentials

All accounts use password: **`admin123`**

| Role | Email | Dashboard |
|------|-------|-----------|
| **Admin** | `admin@hcdc.edu.ph` | `/admin` — Full system control |
| **Archivist** | `archivist@hcdc.edu.ph` | `/archivist` — Cataloging & requests |
| **Student** | `student@hcdc.edu.ph` | `/student` — Browse & request access |

---

## 👥 User Roles

### Administrator
- Manage all users, materials, categories
- Approve/reject access requests
- Configure system settings
- View complete audit logs & announcements

### Archivist
- Ingest new materials with ISAD(G) metadata
- Edit metadata and Dublin Core elements
- Process access requests
- Generate preservation reports

### Public User / Student
- Browse public collections freely
- Search materials by keyword, category, date
- Request access to restricted materials
- Download public items

---

## 📊 Access Levels

| Level | Color | Description |
|-------|-------|-------------|
| **Public** | 🔵 Blue | Freely accessible, no account required |
| **Restricted** | 🟡 Amber | Requires approved access request |
| **Confidential** | 🔴 Red | Admin/archivist only |

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/register` | Register new account (pending approval) |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/auth/logout` | Logout |

### Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/materials` | List materials (with search/filter) |
| `POST` | `/api/materials` | Create material (admin/archivist) |
| `GET` | `/api/materials/:id` | Get material details |
| `PUT` | `/api/materials/:id` | Update material |
| `DELETE` | `/api/materials/:id` | Delete material |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | List all categories |
| `POST` | `/api/categories` | Create category |
| `PUT` | `/api/categories/:id` | Update category |
| `DELETE` | `/api/categories/:id` | Delete category |

### Access Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/requests` | List requests (filter by status) |
| `POST` | `/api/requests` | Submit access request |
| `POST` | `/api/requests/:id/approve` | Approve request |
| `POST` | `/api/requests/:id/reject` | Reject request |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS v4, Custom design system |
| **Routing** | Wouter |
| **State** | TanStack React Query |
| **UI Components** | Radix UI primitives, Lucide icons |
| **Backend** | Express 5, TypeScript/ESM |
| **Database** | PostgreSQL (Drizzle ORM), JSON file fallback |
| **Auth** | JWT (Bearer tokens) |
| **Fonts** | Outfit (sans), Lora (serif) |

---

## 🎨 Design System

### Brand Colors
- **Royal Blue** `#4169E1` — Primary accent
- **Deep Red** `#960000` — Confidential/warning accent
- **Navy** `#0a1628` — Dark backgrounds

### Typography
- **Outfit** — Headlines and body text
- **Lora** — Serif italic for emphasis

### Landing Page Effects
- Parallax hero with scroll-driven background movement
- Staggered fade-in-up entrance animations
- Intersection Observer scroll reveal with 120ms stagger
- Glassmorphism navbar with dark red tint
- Animated gradient glows with floating motion

---

## ⚠️ Troubleshooting

### "Can't Log In" (500 Error)
1. **Start the API server** — The backend must be running on port `5000`
2. **Clear stale JWT** — Browser DevTools → Application → Local Storage → delete `iarchive_token`
3. **Check API logs** — Look at the terminal running the API server for errors

### API Returns Empty Data
- JSON fallback files may be empty — check `categories.json`, `materials.json` in the project root
- Ensure PostgreSQL is connected, or rely on JSON fallback mode

---

## 📜 Standards Compliance

- **OAIS** (ISO 14721:2012) — Open Archival Information System
- **ISAD(G)** — General International Standard Archival Description
- **Dublin Core** — Metadata element set
- **SHA-256** — Fixity verification for preservation integrity

---

## 📄 License

© 2026 Holy Cross of Davao College. All rights reserved.
Unauthorized reproduction prohibited.
