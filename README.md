# SynGen: AI Literature Review & Generic Drug Synthesis Portal

SynGen is a state-of-the-art, regulatory-grade literature review and process chemistry routing portal designed for pharmaceutical process chemists and researchers. Tailored for generic drug synthesis planning and scale-up, the platform integrates live chemical database lookups, academic literature citation indexing, and FDA labeling databases with advanced LLM reasoning to design robust industrial chemical syntheses and draft official regulatory documents.

The platform is pre-optimized for a pilot compound case study—**Imatinib Mesylate** (Gleevec)—and supports dynamic live routing and regulatory drafting for any active drug molecule (e.g., **Sildenafil**, **Metformin**).

<img width="1840" height="1103" alt="Screenshot 2026-05-30 at 8 20 23 PM" src="https://github.com/user-attachments/assets/65cb3875-311e-4fba-bc43-50b8565df637" />

---

## 🚀 Key Features

### 1. Gemini-Inspired Landing & Welcome Hub
- A highly polished, minimalist landing experience matching modern generative AI layouts.
- Features a central, glowing capsule search bar for instant molecule retrieval.
- Interactive recommendation cards to quickly launch pre-configured pilot case studies.

### 2. Live Multi-Database Scientific Querying
- **PubChem & ChEMBL Integration**: Resolves IUPAC nomenclature, molecular weight, canonical SMILES strings, and active chemical formulas.
- **Theme-Aware Skeletal Rendering**: Renders chemical bond-line diagrams dynamically, utilizing high-contrast, theme-inverting CSS filters (`invert`, `hue-rotate`, `brightness`) to seamlessly render white-on-dark skeletal structures in Dark Mode.
- **OpenAlex Scholarly Engine**: Indexes academic synthesis publications and DOIs, presenting them in a clean, scrollable tabular literature hub.

### 3. Proposed Industrial Synthesis Route Timeline
- Interactive, collapsible timeline accordion widgets displaying step-by-step generic routing.
- Formulates reaction formulas, yields, temperatures, and durations.
- Integrates E-factors (environmental waste metrics) and detailed continuous-flow microfluidic transition recommendations.
- Analyzes GHS Hazard codes and labels steps with reactive Green, Yellow, and Red caution badges.

### 4. FDA Regulatory Radar
- Packs critical regulatory insights into uniform, zero-padded minimalist cards.
- **US Brand Mappings**: Displays brand names, manufacturers, and Primary Product NDCs.
- **Clinical Alerts**: Lists boxed warnings and cautions extracted directly from live openFDA labeling databases.
- **MedDRA Adverse Reaction Index**: Visualizes adverse clinical events dynamically via custom horizontal bar charts.
- **Supply Shortage Monitor**: Displays supply histories and active market shortage alerts.

### 5. Gemini 3.5 Flash Scale-Up Dossier
- Scrollable, responsive flexbox container displaying autonomous process chemistry advisories.
- Detailed engineering guidelines covering process safety, basic gas scrubbing (e.g., HCl and Pyridine venting mitigations), and thermal crystallization monitoring (Raman-metered alpha-polymorph conversion controls).

### 6. Automated Drug Master File (DMF) Generator
- A prominent, full-width purple CTA button anchored at the bottom of the Dossier panel.
- Triggers dynamic, regulatory-grade drafts of a **Type II (Drug Substance) Drug Master File** in compliance with official FDA and ICH M4Q CTD Section 3.2.S guidelines.
- Features a custom client-side Markdown-to-HTML compiler (`parseMarkdown`) to render headers, bulleted lists, code blocks, bold text, and structured tables cleanly.
- Integrated export tools to **Copy Raw** markdown directly to the clipboard or **Download .md** to save the submission draft locally.

---

## 🛠 Technology Stack

### Frontend Portal
- **Core**: HTML5, Vanilla JavaScript.
- **Styling**: Vanilla CSS (Slate-themed, zero-padding minimalist card containers, custom glow triggers, smooth light/dark theme transition layers).
- **Icons**: FontAwesome 6.4.0.
- **Typography**: Outfit & Inter (Google Fonts).

### FastAPI Backend
- **Framework**: FastAPI (Python 3.11+), Uvicorn.
- **Data Validation**: Pydantic v2.
- **Generative AI**: `google-generativeai` (Gemini 1.5 Flash).
- **Subprocess Skills Orchestration**: Executes DeepMind `science-skills` SDK modules (`pubchem_api.py`, `chembl_api.py`, `openalex_cli.py`, `openfda_query.py`) under isolated virtual environment subprocesses to maintain database lookups.

---

## 📦 Project Structure

```
deepmind-hackathon/
├── README.md                 # Project documentation
├── run.sh                    # Automated shell launcher (virtual env, dependencies, dual dev servers)
├── backend/
│   ├── main.py               # FastAPI router, live database orchestration, fallback structured routing
│   ├── requirements.txt      # Python dependencies
│   └── skills_helper.py      # Subprocess Science Skills wrapper scripts executor
├── frontend/
│   ├── index.html            # Dashboard grid layout, settings panel, and DMF preview modal
│   ├── style.css             # Slate dark/light styles, full-width CTA buttons, and responsive cards
│   └── app.js                # Requisition triggers, client-side markdown compiler, and modal bindings
└── science-skills/           # DeepMind Science Skills SDK dependency
```

---

## 🔧 Installation & Local Setup

### Prerequisites
- Python 3.11 or higher installed on your system.
- `uv` package manager (optional, but highly recommended for fast virtual environment compilations; falls back to standard `pip` automatically).

### Launching the Application
The repository includes a unified, robust bash script `run.sh` that automates virtual environment creation, activates it, compiles all requirements, and boots the dual server processes:

1. Open a terminal and navigate to the project directory.
2. Grant execution permissions and run the startup script:
   ```bash
   chmod +x run.sh
   ./run.sh
   ```
3. The script will initialize the environment, write uvicorn logs in the background, and launch both endpoints:
   - **Frontend Portal**: [http://localhost:3000](http://localhost:3000)
   - **Backend OpenAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

4. Press `Ctrl+C` in the terminal to trigger the background trap and gracefully terminate both servers.

---

## ⚙ Engine Settings Configuration

By default, the backend runs a **fallback structured planner** that dynamically queries PubChem, ChEMBL, openFDA, and OpenAlex, and compiles standard process pathways and Type II DMF drafts entirely offline/keyless.

To unlock the full potential of **autonomous AI planning** and customized regulatory DMF generation:
1. Open the portal at [http://localhost:3000](http://localhost:3000).
2. Click the **Engine Settings** tab in the sidebar.
3. Input your **Google Gemini API Key** (and optional OpenAlex or openFDA keys).
4. Click **Save Configuration**.
5. All subsequent searches will delegate chemical conversion routing and CTD drafting to Gemini 3.5 Flash, generating highly customized regulatory dossier submissions!
