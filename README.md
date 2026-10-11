# IGNOU Percentage Calculator (Client-Side Only)

A responsive, privacy-preserving IGNOU Percentage Calculator built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and styled according to the **ChaiUI design system** (`https://ui.chaicode.com`).

---

## 🌟 Key Highlights

- **Automated Official Portal Fetching**: Connects directly to the official IGNOU ASP.NET portal (`gradecard.ignou.ac.in`) using a local Next.js route handler (`/api/gradecard`) that seamlessly handles the ASP.NET AJAX UpdatePanel postback flow, ViewState tokens, and dynamic category mappings.
- **Client Fallback & Offline Support**: If the official portal is offline, undergoing maintenance, or unreachable, students can instantly paste table HTML, upload a `.html` marksheet file, or enter scores manually. Zero third-party proxy leaks.
- **Robust DOMParser HTML Engine**: Inspects dynamic table headers rather than fixed column offsets, extracts assignment marks, TEE marks, practical marks, and completion status.
- **Transparent CORS Handling**: Detects official portal browser restrictions gracefully without leaking student credentials through unverified public scraping proxies.
- **Triple Import Fallback**:
  1. Pasting copied grade card HTML table or text.
  2. Uploading local `.html` grade card files.
  3. Interactive manual course mark entry and real-time mark simulation.
- **Automated Tests**: Unit and integration test suite with Vitest verifying validation, parsing, calculations, duplicate courses, and edge cases.
- **ChaiUI Look & Feel**: Near-black warm background with hexagon ambient glow, Manrope typography, Montserrat highlight phrases, asymmetric buttons, and zero prohibited orange fills.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js `v20+`
- npm `10+`

### 2. Installation
```bash
# Clone or navigate to the repository
cd percentage-calculator

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Tests
```bash
npm run test
```

### 5. Build for Production
```bash
npm run build
```

---

## 📐 Architecture & Structure

```
src/
├── app/
│   ├── layout.tsx                # App layout with ChaiUI theme tokens & SEO metadata
│   ├── page.tsx                  # Main application dashboard & hero section
│   └── globals.css               # ChaiUI CSS design tokens and print styles
├── components/
│   ├── navbar.tsx                # Sticky blurred header with brand & theme switcher
│   ├── backdrop.tsx              # Ambient hexagon glow backdrop SVG
│   ├── footer.tsx                # Hairline footer with privacy guarantees
│   ├── enrollment-form.tsx       # Enrollment number & programme search form
│   ├── manual-grade-card-import.tsx # 3-in-1 import fallback (Paste, Upload, Manual)
│   ├── grade-card-results.tsx    # Academic KPI cards & summary dashboard
│   ├── course-marks-table.tsx    # Interactive course-wise table with simulation
│   ├── calculation-summary.tsx   # Detailed formula breakdown & official references
│   └── ui/                       # ChaiUI themed buttons, cards, inputs, chips, badges
├── config/
│   └── ignou-programme-rules.ts  # Verified evaluation rules, weightages & credits
├── lib/
│   ├── ignou-calculator.ts       # Pure calculation functions (credit-weighted, aggregate)
│   ├── ignou-grade-card.ts       # Client fetch adapter with CORS & status handling
│   ├── ignou-grade-card-parser.ts# Browser DOMParser & regex extraction engine
│   ├── validation.ts             # Zod input schemas for enrollment and courses
│   └── utils.ts                  # ChaiUI class merger utility
├── types/
│   └── ignou.ts                  # TypeScript interfaces and data contracts
└── tests/
    ├── validation.test.ts        # Input validation & normalization tests
    ├── parser.test.ts            # Grade card HTML & text parsing tests
    └── calculator.test.ts        # Programme rules, weightages & pass criteria tests
```

---

## ⚖️ IGNOU Evaluation Formulas

| Programme | Evaluation Ratio | Pass Criteria (Separate) | Aggregation Method |
|---|---|---|---|
| **BCA** | 30:70 (Standard)<br>25:75 (`BCS-012`, `BCS-040`, `BCSL` labs) | 40% Assignment & 40% TEE | Credit-Weighted Average |
| **MCA / MCA_NEW** | 30% Assignment + 70% TEE | 40% Assignment & 40% TEE | Credit-Weighted Average |
| **BAG / BCOMG / BSCG (CBCS)** | 30% Assignment + 70% TEE | 35% Assignment & 35% TEE | Credit-Weighted Average |
| **BA / BCOM / BSC (Legacy BDP)**| 30% Assignment + 70% TEE | 35% Assignment & 35% TEE | Raw Aggregate Percentage |
| **Master's (MEG, MPS, MBA)** | 30% Assignment + 70% TEE | 40% Assignment & 40% TEE | Credit-Weighted Average |

### How to Add Newly Verified Programme Rules
To register newly verified rules for additional IGNOU degrees:
1. Open `src/config/ignou-programme-rules.ts`.
2. Add a new entry to `VERIFIED_PROGRAMME_RULES` specifying:
   - `programmeCode`: Official code (e.g. `MSW`).
   - `defaultAssessmentWeightage`: Assessment weightages (e.g. `{ assignment: 0.30, theory: 0.70 }`).
   - `passMarks`: Component thresholds (e.g. 40% for PG, 35% for UG).
   - `aggregationMethod`: `'credit_weighted'` or `'raw_aggregate'`.
   - `officialSourceReference`: Official handbook citation.
   - `isVerified`: `true`.

---

## 🔒 Security & Privacy Notice
- No analytics trackers or telemetry.
- No cookies or remote session storage.
- All files uploaded via the import tab are processed in memory with `FileReader` and `DOMParser` and are immediately discarded.
# percentage-calculator
