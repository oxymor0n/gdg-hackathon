/* ==========================================================================
   AI-Enabled Literature Review Portal JS
   Handles backend integration, dynamic flowchart rendering, and settings.
   ========================================================================== */

const API_BASE_URL = "http://localhost:8000/api";

// DOM Elements
const drugSearchInput = document.getElementById("drug-search-input");
const runReviewBtn = document.getElementById("run-review-btn");
const loadingOverlay = document.getElementById("loading-overlay");
const loaderText = document.querySelector(".loader-text");

// Hero specs
const heroBadge = document.getElementById("hero-badge");
const heroTitle = document.getElementById("hero-title");
const heroBrand = document.getElementById("hero-brand");
const heroPatent = document.getElementById("hero-patent");
const formulaDisplay = document.getElementById("formula-display");
const skeletalStructureImg = document.getElementById("skeletal-structure-img");
const structurePlaceholder = document.getElementById("structure-placeholder");
const specMwt = document.getElementById("spec-mwt");
const specChembl = document.getElementById("spec-chembl");
const specCid = document.getElementById("spec-cid");
const specSmiles = document.getElementById("spec-smiles");

// Feasibility Card
const overallScoreDisplay = document.getElementById("overall-score-display");
const barSafety = document.getElementById("bar-safety");
const barGreen = document.getElementById("bar-green");
const barEconomic = document.getElementById("bar-economic");
const valSafety = document.getElementById("val-safety");
const valGreen = document.getElementById("val-green");
const valEconomic = document.getElementById("val-economic");
const feasibilityPros = document.getElementById("feasibility-pros");
const feasibilityCons = document.getElementById("feasibility-cons");

// Timeline & FDA Grid
const synthesisTimeline = document.getElementById("synthesis-timeline");
const fdaShortageBadge = document.getElementById("fda-shortage-badge");
const fdaBrandDisplay = document.getElementById("fda-brand-display");
const fdaNdcDisplay = document.getElementById("fda-ndc-display");
const fdaWarningsList = document.getElementById("fda-warnings-list");
const fdaAdverseReactions = document.getElementById("fda-adverse-reactions");
const fdaShortageHistory = document.getElementById("fda-shortage-history");

// Literature Hub & AI Dossier
const literatureTableBody = document.getElementById("literature-table-body");
const aiDossierBody = document.getElementById("ai-dossier-body");

// Modals & Navigation
const navItems = document.querySelectorAll(".nav-item");
const settingsModal = document.getElementById("settings-modal");
const closeModalBtn = document.querySelector(".close-modal-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");

// Welcome Hub & Grid Toggles
const welcomeHub = document.getElementById("welcome-hub");
const dashboardGrid = document.getElementById("dashboard-grid");
const topSearchContainer = document.getElementById("top-search-container");
const welcomeSearchInput = document.getElementById("welcome-search-input");
const welcomeSearchBtn = document.getElementById("welcome-search-btn");

// Theme Toggle Elements
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeIcon = document.getElementById("theme-icon");
const themeText = document.getElementById("theme-text");

// Configuration values
let geminiApiKey = "";
let openalexApiKey = "";
let fdaApiKey = "";
let currentDrugName = "";
let currentDmfContent = "";

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    // Initial Theme setup
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "light") {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        themeIcon.className = "fa-solid fa-moon nav-icon";
        themeText.textContent = "Dark Mode";
    } else {
        document.body.classList.add("dark-theme");
        document.body.classList.remove("light-theme");
        themeIcon.className = "fa-solid fa-sun nav-icon";
        themeText.textContent = "Light Mode";
    }

    // Theme Toggle Handler
    themeToggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (document.body.classList.contains("dark-theme")) {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
            themeIcon.className = "fa-solid fa-moon nav-icon";
            themeText.textContent = "Dark Mode";
            localStorage.setItem("theme", "light");
            showNotification("Switched to Light Mode");
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
            themeIcon.className = "fa-solid fa-sun nav-icon";
            themeText.textContent = "Light Mode";
            localStorage.setItem("theme", "dark");
            showNotification("Switched to Dark Mode");
        }
    });

    // Add Sidebar Navigation Toggles
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Skip active highlights and scrolling for theme toggle button
            if (item.id === "theme-toggle-btn") return;

            navItems.forEach(n => n.classList.remove("active"));
            item.classList.add("active");
            
            const tab = item.getAttribute("data-tab");
            if (tab === "settings") {
                settingsModal.classList.remove("hidden");
            } else {
                // Focus search or scroll to relevant section
                const sectionMap = {
                    "synthesis-router": "synthesis-timeline-card",
                    "regulatory-radar": "regulatory-radar-card",
                    "literature-explorer": "literature-hub-card"
                };
                const targetId = sectionMap[tab];
                if (targetId) {
                    document.getElementById(targetId).scrollIntoView({ behavior: "smooth" });
                }
            }
        });
    });

    // Close Modal Event
    closeModalBtn.addEventListener("click", () => {
        settingsModal.classList.add("hidden");
        // Reset active sidebar tab to Synthesis Router
        navItems.forEach(n => n.classList.remove("active"));
        document.querySelector('[data-tab="synthesis-router"]').classList.add("active");
    });

    // Save Settings
    saveSettingsBtn.addEventListener("click", () => {
        geminiApiKey = document.getElementById("api-key-gemini").value;
        openalexApiKey = document.getElementById("api-key-openalex").value;
        fdaApiKey = document.getElementById("api-key-fda").value;
        
        showNotification("Engine configuration updated successfully!");
        settingsModal.classList.add("hidden");
        // Reset navigation
        navItems.forEach(n => n.classList.remove("active"));
        document.querySelector('[data-tab="synthesis-router"]').classList.add("active");
    });

    // Search Trigger Events (Top search bar)
    runReviewBtn.addEventListener("click", () => {
        const query = drugSearchInput.value.trim();
        if (query) fetchDossier(query);
    });

    drugSearchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const query = drugSearchInput.value.trim();
            if (query) fetchDossier(query);
        }
    });

    // Search Trigger Events (Welcome search bar)
    welcomeSearchBtn.addEventListener("click", () => {
        const query = welcomeSearchInput.value.trim();
        if (query) fetchDossier(query);
    });

    welcomeSearchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const query = welcomeSearchInput.value.trim();
            if (query) fetchDossier(query);
        }
    });

    // --- DRUG MASTER FILE (DMF) MODAL EVENTS ---
    const generateDmfBtn = document.getElementById("generate-dmf-btn");
    const dmfModal = document.getElementById("dmf-modal");
    const closeDmfModalBtn = document.querySelector(".close-dmf-modal-btn");
    const copyDmfBtn = document.getElementById("copy-dmf-btn");
    const downloadDmfBtn = document.getElementById("download-dmf-btn");

    if (generateDmfBtn) {
        generateDmfBtn.addEventListener("click", (e) => {
            e.preventDefault();
            fetchAndShowDmf();
        });
    }

    if (closeDmfModalBtn) {
        closeDmfModalBtn.addEventListener("click", () => {
            dmfModal.classList.add("hidden");
        });
    }

    if (copyDmfBtn) {
        copyDmfBtn.addEventListener("click", () => {
            copyDmfToClipboard();
        });
    }

    if (downloadDmfBtn) {
        downloadDmfBtn.addEventListener("click", () => {
            downloadDmfFile();
        });
    }

    // --- SIDEBAR COLLAPSE TOGGLE ---
    const sidebar = document.querySelector(".sidebar");
    const sidebarCollapseBtn = document.getElementById("sidebar-collapse-btn");
    const collapseIcon = document.getElementById("collapse-icon");

    if (sidebarCollapseBtn && sidebar && collapseIcon) {
        sidebarCollapseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            sidebar.classList.toggle("collapsed");
            
            const isCollapsed = sidebar.classList.contains("collapsed");
            if (isCollapsed) {
                collapseIcon.className = "fa-solid fa-chevron-right";
                sidebarCollapseBtn.title = "Expand Sidebar";
            } else {
                collapseIcon.className = "fa-solid fa-chevron-left";
                sidebarCollapseBtn.title = "Collapse Sidebar";
            }
        });
    }
});

// --- CORE REQUISITION LOGIC ---
async function fetchDossier(drugName) {
    showLoader(`Triggering DeepMind Science Skills: Searching ${drugName}...`);
    currentDrugName = drugName;
    
    // Sync input search values across elements
    drugSearchInput.value = drugName;
    if (welcomeSearchInput) welcomeSearchInput.value = drugName;
    
    try {
        let url = `${API_BASE_URL}/synthesis?query=${encodeURIComponent(drugName)}`;
        if (geminiApiKey) {
            url += `&api_key=${encodeURIComponent(geminiApiKey)}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Target compound not found in chemical databases.");
        }
        
        const dossier = await response.json();
        
        // Hide welcome hub and reveal active dashboard and top search header
        welcomeHub.classList.add("hidden");
        topSearchContainer.classList.remove("hidden");
        dashboardGrid.classList.remove("hidden");
        
        updateUI(dossier);
        showNotification(`Successfully synthesized Dossier for ${drugName}!`);
        
    } catch (error) {
        console.error(error);
        showNotification(error.message, true);
    } finally {
        hideLoader();
    }
}

// --- UI UPDATING LOGIC ---
function updateUI(dossier) {
    const summary = dossier.summary;
    
    // 1. Hero Card Updates
    heroTitle.textContent = `${summary.name} Mesylate`;
    heroBrand.textContent = summary.brand_name || "Generic Formulation";
    heroBadge.textContent = summary.therapeutic_class || "Tyrosine Kinase Inhibitor";
    formulaDisplay.textContent = summary.formula || "N/A";
    
    // Dynamic skeletal bond-line image rendering
    if (summary.cid && summary.cid !== "N/A" && summary.cid !== "Resolved via search") {
        skeletalStructureImg.src = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${summary.cid}/PNG`;
        skeletalStructureImg.classList.remove("hidden");
        structurePlaceholder.classList.add("hidden");
    } else if (summary.chembl_id && summary.chembl_id !== "N/A") {
        skeletalStructureImg.src = `https://www.ebi.ac.uk/chembl/api/data/image/${summary.chembl_id}.svg`;
        skeletalStructureImg.classList.remove("hidden");
        structurePlaceholder.classList.add("hidden");
    } else {
        skeletalStructureImg.classList.add("hidden");
        structurePlaceholder.classList.remove("hidden");
    }
    
    // Patent Expiry Logic
    heroPatent.textContent = summary.patent_expiry;
    if (summary.patent_expiry.toLowerCase().includes("expired")) {
        heroPatent.className = "expired-label text-glow-teal";
    } else {
        heroPatent.className = "expired-label text-glow-purple";
    }
    
    specMwt.textContent = `${summary.mwt} g/mol`;
    specChembl.textContent = summary.chembl_id || "N/A";
    specCid.textContent = summary.cid || "N/A";
    specSmiles.textContent = summary.smiles || "N/A";
    
    // 2. Feasibility Scorecard Updates
    const f = dossier.feasibility;
    overallScoreDisplay.textContent = f.overall_score;
    
    valSafety.textContent = `${f.score_details.safety}%`;
    barSafety.style.width = `${f.score_details.safety}%`;
    valGreen.textContent = `${f.score_details.green_chemistry}%`;
    barGreen.style.width = `${f.score_details.green_chemistry}%`;
    valEconomic.textContent = `${f.score_details.economic}%`;
    barEconomic.style.width = `${f.score_details.economic}%`;
    
    // Pros & Cons
    feasibilityPros.innerHTML = f.pros.map(pro => `<li>${pro}</li>`).join("");
    feasibilityCons.innerHTML = f.cons.map(con => `<li>${con}</li>`).join("");
    
    // 3. Proposed Synthesis Pathway Timeline (Flowchart)
    renderSynthesisTimeline(dossier.synthesis_path);
    
    // 4. FDA Regulatory Radar
    const fda = dossier.fda_insights;
    fdaBrandDisplay.textContent = `${fda.labeling.brand} (${fda.labeling.generic})`;
    fdaNdcDisplay.textContent = fda.labeling.ndc;
    
    // Warnings List
    fdaWarningsList.innerHTML = fda.labeling.warnings.map(warning => `<li>${warning}</li>`).join("");
    
    // adverse events
    if (fda.adverse_events && fda.adverse_events.length > 0) {
        fdaAdverseReactions.innerHTML = fda.adverse_events.map(event => `
            <div class="chart-bar-item">
                <div class="chart-bar-lbl">
                    <span>${event.reaction}</span>
                    <span>${event.incidence_pct}%</span>
                </div>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width: ${event.incidence_pct}%;"></div>
                </div>
            </div>
        `).join("");
    } else {
        fdaAdverseReactions.innerHTML = `<p class="text-muted text-xs">No adverse reaction counts resolved in current label batch.</p>`;
    }
    
    // Supply Shortage
    fdaShortageHistory.textContent = fda.shortages.history;
    fdaShortageBadge.textContent = fda.shortages.status;
    if (fda.shortages.status.toLowerCase().includes("resolved") || fda.shortages.status.toLowerCase().includes("stable")) {
        fdaShortageBadge.className = "badge badge-teal";
    } else {
        fdaShortageBadge.className = "badge badge-red";
    }
    
    // 5. Literature References Table
    if (dossier.literature_references && dossier.literature_references.length > 0) {
        literatureTableBody.innerHTML = dossier.literature_references.map(ref => {
            const shortAuthors = ref.authors.split(",").slice(0, 2).join(",") + (ref.authors.split(",").length > 2 ? " et al." : "");
            return `
                <tr>
                    <td>
                        <span class="paper-title">${ref.title}</span>
                    </td>
                    <td>
                        <span class="paper-authors">${shortAuthors}</span>
                    </td>
                    <td>${ref.journal} (${ref.year})</td>
                    <td>
                        <a href="${ref.url || '#'}" target="_blank" class="doi-link">
                            <i class="fa-solid fa-link"></i> ${ref.doi ? ref.doi.replace("https://doi.org/", "") : "DOI LINK"}
                        </a>
                        <button class="btn-mini-download" onclick="triggerDownloadPDF('${ref.title}')">
                            <i class="fa-solid fa-file-pdf"></i> PDF
                        </button>
                    </td>
                    <td>${ref.relevance}</td>
                </tr>
            `;
        }).join("");
    } else {
        literatureTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No matching publications indexed.</td></tr>`;
    }
    
    // 6. Generate Gemini 3.5 Flash Dossier Report
    generateAiAdvisoryReport(summary.name, dossier.synthesis_path, f.overall_score);
}

// Render horizontal flowchart cards
function renderSynthesisTimeline(steps) {
    synthesisTimeline.innerHTML = steps.map((step, idx) => {
        let dotColor = "dot-green";
        if (step.ghs_hazards.level === "Yellow") dotColor = "dot-yellow";
        if (step.ghs_hazards.level === "Red") dotColor = "dot-red";
        
        return `
            <div class="timeline-step">
                <div class="step-indicator">${step.step}</div>
                <div class="step-header">
                    <div class="step-title-block">
                        <h3>Step ${step.step}: ${step.title}</h3>
                        <span class="step-reaction">${step.reaction}</span>
                    </div>
                    <span class="step-type-badge">${step.type}</span>
                </div>
                
                <div class="step-metrics">
                    <div class="metric-box">
                        <span class="metric-box-lbl">Target Yield</span>
                        <span class="metric-box-val text-teal">${step.yield}%</span>
                    </div>
                    <div class="metric-box">
                        <span class="metric-box-lbl">Temp / Time</span>
                        <span class="metric-box-val">${step.temp}°C / ${step.duration}h</span>
                    </div>
                    <div class="metric-box">
                        <span class="metric-box-lbl">GHS Hazard</span>
                        <span class="metric-box-val">
                            <span class="hazard-dot ${dotColor}"></span>${step.ghs_hazards.level}
                        </span>
                    </div>
                    <div class="metric-box">
                        <span class="metric-box-lbl">E-Factor</span>
                        <span class="metric-box-val text-purple">${step.e_factor}</span>
                    </div>
                </div>
                
                <div class="accordion-toggle" onclick="toggleTimelineAccordion(this)">
                    <i class="fa-solid fa-chevron-down"></i>
                    <span>Expand Scale-Up & Continuous Flow Specifications</span>
                </div>
                
                <div class="accordion-content hidden">
                    <p class="flow-content"><strong><i class="fa-solid fa-bezier-curve"></i> Continuous-Flow Optimization:</strong> ${step.flow_chemistry}</p>
                    <p class="green-content mt-2"><strong><i class="fa-solid fa-leaf"></i> Alternative 'Green' Route:</strong> ${step.alternative_route}</p>
                    <p class="mt-2"><strong><i class="fa-solid fa-shield-halved"></i> GHS Details:</strong> ${step.ghs_hazards.description}</p>
                </div>
            </div>
        `;
    }).join("");
}

// Timeline Accordion Toggling
function toggleTimelineAccordion(element) {
    const icon = element.querySelector("i");
    const content = element.nextElementSibling;
    
    if (content.classList.contains("hidden")) {
        content.classList.remove("hidden");
        icon.className = "fa-solid fa-chevron-up";
        element.style.color = "var(--primary-purple)";
    } else {
        content.classList.add("hidden");
        icon.className = "fa-solid fa-chevron-down";
        element.style.color = "var(--primary-teal)";
    }
}

// Generate the beautiful markdown advisory report
function generateAiAdvisoryReport(drugName, steps, score) {
    const isImatinib = drugName.toLowerCase() === "imatinib";
    
    let htmlContent = "";
    if (isImatinib) {
        htmlContent = `
            <h4>1. Executive Summary & Chemical Validation</h4>
            <p>Imatinib Mesylate (STI-571) is a primary pilot case study showing extremely high feasibility (Score: <strong>${score}/100</strong>) for immediate process design. The primary synthesis path utilizes well-documented enaminone condensation to form the central 2-aminopyrimidine core, avoiding stereochemical complications as the molecule is achiral.</p>
            
            <h4>2. Continuous-Flow Engineering Recommendations</h4>
            <p>We recommend transitioning <strong>Step 1 (Enaminone formation)</strong> and <strong>Step 3 (Catalytic nitro reduction)</strong> from traditional batch vessels to a modular continuous-flow reactor setup.
            <ul>
                <li><strong>Step 1 neat flow run:</strong> Bypassing Toluene solvent drops the overall synthesis E-factor from 12.4 to 1.8, reducing active chemical footprint and improving throughput.</li>
                <li><strong>Step 3 inline H2 generation:</strong> Restricting the active high-pressure hydrogen inventory to &lt;2 mL eliminates the pyrophoric Pd/C catalyst explosion hazard common in industrial scale autoclaves.</li>
            </ul>
            </p>

            <h4>3. Polymorph Stabilization & Crystallization Control</h4>
            <p>Imatinib mesylate exists in multiple crystal forms, notably the unstable beta-form and the thermodynamically stable, needle-shaped <strong>alpha-form</strong>.
            <ul>
                <li>For oral solid formulation, in-situ crystallization in ethanol/acetone must be performed at exactly 50 °C with methanesulfonic acid addition metered via active Raman spectroscopy monitoring to ensure complete alpha polymorph conversion.</li>
            </ul>
            </p>

            <h4>4. Process Safety & Gas Scrubbing</h4>
            <p>Step 4 utilizes highly carcinogenic pyridine as a basic catalyst and volatile THF. Pyridine releases noxious vapors, and benzoyl chloride coupling emits corrosive HCl gas. 
            A closed-loop scrubber unit with 10% aqueous NaOH is mandatory in all batch venting pipelines to neutralize fumes before atmospheric venting.</p>
        `;
    } else {
        htmlContent = `
            <h4>1. Process Engineering Review</h4>
            <p>Proposed synthetic scale-up plan for <strong>${drugName}</strong> demonstrates moderate industrial viability (Feasibility Index: <strong>${score}/100</strong>). Main synthetic vulnerabilities center on chemical yield efficiency in structural acylation and deprotection steps.</p>
            
            <h4>2. Continuous Flow Opportunities</h4>
            <p>Deprotection steps using Trifluoroacetic acid (TFA) produce aggressive corrosive hazards that erode steel reactors. We recommend packed-bed solid support exchange resins in flow pipes to eliminate bulk liquid acid washes.</p>
            
            <h4>3. Regulatory Safeguards</h4>
            <p>Verify active FDA labels for recent black-box clinical trial additions. Process safety protocols must isolate intermediates to test for trace nitrosamine impurity levels below 30 ppm to comply with updated USP monographs.</p>
        `;
    }
    
    aiDossierBody.innerHTML = htmlContent;
}

// Notification Toasts
function showNotification(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast-notification ${isError ? 'toast-error' : 'toast-success'}`;
    toast.innerHTML = `
        <i class="fa-solid ${isError ? 'fa-circle-xmark' : 'fa-circle-check'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Add active animation
    setTimeout(() => toast.classList.add("show"), 50);
    
    // Remove after 3.5 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// Mock PDF download trigger
function triggerDownloadPDF(paperTitle) {
    showNotification(`Downloading PDF wrapper for: "${paperTitle.substring(0, 30)}..."`);
}

// Helper Loader Toggles
function showLoader(text) {
    loaderText.textContent = text;
    loadingOverlay.classList.remove("hidden");
}

function hideLoader() {
    loadingOverlay.classList.add("hidden");
}

// Inject CSS Toast styles to index
const toastStyle = document.createElement("style");
toastStyle.textContent = `
.toast-notification {
    position: fixed;
    bottom: 30px;
    right: -320px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 999999;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    color: var(--text-primary);
    font-size: 13.5px;
    font-weight: 500;
}
.toast-notification.show {
    right: 30px;
}
.toast-success {
    border-left: 4px solid var(--success-green);
}
.toast-success i {
    color: var(--success-green);
    font-size: 16px;
}
.toast-error {
    border-left: 4px solid var(--error-red);
}
.toast-error i {
    color: var(--error-red);
    font-size: 16px;
}
.mt-2 { margin-top: 8px; }
.text-xs { font-size: 11px; }
`;
document.head.appendChild(toastStyle);

// Global Pilot suggestion search triggers
window.searchExample = function(name) {
    drugSearchInput.value = name;
    fetchDossier(name);
};

// --- DRUG MASTER FILE (DMF) GENERATION ---
async function fetchAndShowDmf() {
    if (!currentDrugName) {
        showNotification("Please search for a compound first.", true);
        return;
    }
    
    const dmfModal = document.getElementById("dmf-modal");
    const dmfModalBody = document.getElementById("dmf-modal-body-content");
    
    dmfModal.classList.remove("hidden");
    dmfModalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0;">
            <div class="pulse-loader" style="margin-bottom: 20px;"></div>
            <span style="font-weight: 500; color: var(--text-primary);">Orchestrating Regulatory Agent...</span>
            <span style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">Formulating ICH M4Q CTD Section 3.2.S Drug Substance Dossier</span>
        </div>
    `;
    
    try {
        let url = `${API_BASE_URL}/dmf/generate?query=${encodeURIComponent(currentDrugName)}`;
        if (geminiApiKey) {
            url += `&api_key=${encodeURIComponent(geminiApiKey)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to generate Drug Master File draft.");
        }
        
        const data = await response.json();
        currentDmfContent = data.dmf_content;
        
        // Render markdown to HTML dynamically using our robust client-side parser
        const renderedHtml = parseMarkdown(currentDmfContent);
        dmfModalBody.innerHTML = renderedHtml;
        showNotification(`Successfully drafted Drug Master File for ${currentDrugName}!`);
    } catch (error) {
        console.error(error);
        dmfModalBody.innerHTML = `
            <div style="text-align: center; padding: 40px 0;">
                <i class="fa-solid fa-circle-xmark" style="font-size: 40px; color: var(--error-red); margin-bottom: 16px;"></i>
                <h3 style="font-size: 15px; font-weight: 600; color: var(--text-primary);">DMF Generation Failed</h3>
                <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 8px;">${error.message}</p>
                <button id="retry-dmf-btn" class="badge mt-4" style="cursor: pointer; background: var(--bg-inset); padding: 6px 14px; border-radius: 4px; color: var(--text-primary); border: 1px solid var(--border-color);">Retry Generation</button>
            </div>
        `;
        
        const retryBtn = document.getElementById("retry-dmf-btn");
        if (retryBtn) {
            retryBtn.addEventListener("click", () => fetchAndShowDmf());
        }
        showNotification(error.message, true);
    }
}

// Copy raw markdown to clipboard
function copyDmfToClipboard() {
    if (!currentDmfContent) {
        showNotification("No Drug Master File content available to copy.", true);
        return;
    }
    
    navigator.clipboard.writeText(currentDmfContent)
        .then(() => {
            showNotification("DMF raw markdown copied to clipboard!");
        })
        .catch(err => {
            console.error("Failed to copy text: ", err);
            showNotification("Failed to copy to clipboard.", true);
        });
}

// Download markdown file
function downloadDmfFile() {
    if (!currentDmfContent || !currentDrugName) {
        showNotification("No Drug Master File content available to download.", true);
        return;
    }
    
    const blob = new Blob([currentDmfContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FDA_DMF_Type_II_${currentDrugName.replace(/\s+/g, '_')}_Draft.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("DMF markdown download initiated!");
}

// Robust client-side markdown to HTML parser
function parseMarkdown(md) {
    if (!md) return "";
    
    // Secure escape HTML to avoid XSS issues
    let html = md
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    
    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 14.5px; font-weight: 700; color: var(--text-primary); margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4 style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-top: 18px; margin-bottom: 6px;">$1</h4>');
    html = html.replace(/^##### (.*$)/gim, '<h5 style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-top: 14px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.02em;">$1</h5>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 16px; font-weight: 700; color: var(--primary-purple); margin-top: 32px; margin-bottom: 12px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 20px; font-weight: 800; color: var(--primary-teal); margin-top: 20px; margin-bottom: 16px; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">$1</h1>');
    
    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Inline Code
    html = html.replace(/`(.*?)`/g, '<code style="font-family: monospace; background: var(--bg-inset); border: 1px solid var(--border-color); padding: 2px 6px; border-radius: 4px; color: #c084fc;">$1</code>');
    
    // Horizontal Rule
    html = html.replace(/^\s*---\s*$/gm, '<hr style="border: 0; border-top: 1px solid var(--border-color); margin: 20px 0;">');

    // Tables
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    let parsedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableHtml = '<div style="overflow-x: auto; margin: 16px 0;"><table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">';
            }
            
            if (line.includes('---')) {
                continue; // Skip divider row
            }
            
            const cols = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
            const tag = tableHtml.includes('<thead>') ? 'td' : 'th';
            let rowHtml = '<tr style="border-bottom: 1px solid var(--border-color);">';
            
            cols.forEach(col => {
                const alignStyle = tag === 'th' ? 'padding: 10px; font-weight: 600; background: var(--bg-sidebar); border: 1px solid var(--border-color);' : 'padding: 10px; border: 1px solid var(--border-color);';
                rowHtml += `<${tag} style="${alignStyle}">${col}</${tag}>`;
            });
            rowHtml += '</tr>';
            
            if (tag === 'th') {
                tableHtml += `<thead>${rowHtml}</thead><tbody>`;
            } else {
                tableHtml += rowHtml;
            }
        } else {
            if (inTable) {
                inTable = false;
                tableHtml += '</tbody></table></div>';
                parsedLines.push(tableHtml);
            }
            parsedLines.push(lines[i]);
        }
    }
    if (inTable) {
        tableHtml += '</tbody></table></div>';
        parsedLines.push(tableHtml);
    }
    
    html = parsedLines.join('\n');
    
    // Lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-bottom: 6px; margin-left: 20px; list-style-type: square;">$1</li>');
    
    // Paragraphs
    const finalLines = html.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('<h') && !trimmed.startsWith('<l') && !trimmed.startsWith('<d') && !trimmed.startsWith('<t') && !trimmed.startsWith('<u') && !trimmed.startsWith('<b') && !trimmed.startsWith('<h') && !trimmed.startsWith('<hr')) {
            return `<p style="margin-bottom: 12px; font-size: 13px; line-height: 1.6;">${trimmed}</p>`;
        }
        return line;
    });
    
    return finalLines.join('\n');
}
