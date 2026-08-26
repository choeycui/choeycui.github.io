const projects = [
  {
    id: "personal-context",
    name: "personal-context",
    thesis: "Versioned, source-backed context with controlled write-back for long-running AI agents.",
    status: "building",
    updated: "2026-08-26",
    tags: ["AI & Agents", "Information & Retrieval", "Infrastructure"],
    role: "Canonical context substrate; Jarvis depends on it.",
    repo: "https://github.com/choeycui/personal-context",
    demo: null,
    featured: true,
    cells: [
      ["ai", "infrastructure"],
      ["information", "infrastructure"],
    ],
  },
  {
    id: "detool",
    name: "DeTool",
    thesis: "Discovery, access, verification, and routing for agent capabilities and data.",
    status: "design",
    updated: "2026-08-26",
    tags: ["AI & Agents", "Web3 & Open Networks", "Infrastructure"],
    role: "Trust and access layer between agents and capabilities.",
    repo: "https://github.com/choeycui/detool",
    demo: null,
    featured: true,
    cells: [
      ["ai", "infrastructure"],
      ["web3", "infrastructure"],
    ],
  },
  {
    id: "intentgraph",
    name: "IntentGraph",
    thesis: "Natural-language intent becomes constraints, a task graph, execution, and verification.",
    status: "design",
    updated: "2026-08-26",
    tags: ["AI & Agents", "Infrastructure", "Planning"],
    role: "Planning and orchestration layer for applications.",
    repo: null,
    demo: null,
    featured: true,
    cells: [["ai", "infrastructure"]],
  },
  {
    id: "agent-skills",
    name: "agent-skills",
    thesis: "Reusable reasoning and action workflows with sources, critics, and verification.",
    status: "experiment",
    updated: "2026-08-26",
    tags: ["AI & Agents", "Infrastructure", "Skills"],
    role: "Composable behavioral layer.",
    repo: null,
    demo: null,
    featured: false,
    cells: [["ai", "infrastructure"]],
  },
  {
    id: "session-health-probe",
    name: "session-health-probe",
    thesis: "Explicit session states: VALID, INVALID, CHALLENGE, or PROBE_FAILURE.",
    status: "building",
    updated: "2026-08-26",
    tags: ["AI & Agents", "Infrastructure", "Reliability"],
    role: "Reliability boundary for browser and agent execution.",
    repo: "https://github.com/choeycui/session-health-probe",
    demo: null,
    featured: true,
    cells: [["ai", "infrastructure"]],
  },
  {
    id: "official-source-monitor",
    name: "official-source-monitor",
    thesis: "Stateful official-source deltas with cursors, coverage checks, and alerts.",
    status: "design",
    updated: "2026-08-26",
    tags: ["Information & Retrieval", "Infrastructure", "Monitoring"],
    role: "Source-change evidence layer.",
    repo: null,
    demo: null,
    featured: false,
    cells: [["information", "infrastructure"]],
  },
  {
    id: "jarvis",
    name: "Jarvis",
    thesis: "A synthetic collaborative-intelligence reference app backed by personal-context.",
    status: "design",
    updated: "2026-08-26",
    tags: ["AI & Agents", "Applications", "Synthetic demo"],
    role: "Infra-backed application; depends on personal-context.",
    repo: null,
    demo: null,
    featured: false,
    cells: [["ai", "applications"]],
  },
  {
    id: "guatian",
    name: "Guatian",
    thesis: "Map competing narratives, actors, timelines, branches, and evidence.",
    status: "live",
    updated: "2026-07-19",
    tags: ["AI & Agents", "Information & Retrieval", "Applications"],
    role: "Live information-structure application and current proof-of-work anchor.",
    repo: "https://github.com/choeycui/guatian-mvp",
    demo: "https://choeycui.github.io/guatian-mvp/",
    featured: true,
    cells: [
      ["ai", "applications"],
      ["information", "applications"],
    ],
  },
  {
    id: "fuzzy-photo-search",
    name: "Fuzzy Photo Search",
    thesis: "Recover personal photos from vague memories using multimodal and metadata signals.",
    status: "experiment",
    updated: "2026-08-26",
    tags: ["AI & Agents", "Information & Retrieval", "Applications"],
    role: "Personal retrieval application; local/private data path.",
    repo: null,
    demo: null,
    featured: true,
    cells: [
      ["ai", "applications"],
      ["information", "applications"],
    ],
  },
  {
    id: "content-growth-engine",
    name: "Content Growth Engine",
    thesis: "Approval-first research, drafting, publishing, read-back, and telemetry.",
    status: "building",
    updated: "2026-08-26",
    tags: ["AI & Agents", "Applications", "Growth operations"],
    role: "Turns engineering evidence into measurable content operations.",
    repo: null,
    demo: null,
    featured: true,
    cells: [["ai", "applications"]],
  },
  {
    id: "novel",
    name: "Serialized Novel",
    thesis: "Original serialized fiction with an AI-assisted drafting and editorial process.",
    status: "writing",
    updated: "2026-08-26",
    tags: ["AI & Agents", "Creative & Writing", "Writing", "AI × Novel"],
    role: "Humanization and writing lane; Yu remains the author and rights holder.",
    repo: "https://github.com/choeycui/wugang-calibration-bureau",
    demo: null,
    featured: true,
    cells: [
      ["ai", "writing"],
      ["creative", "writing"],
    ],
  },
];

const themes = [
  ["ai", "AI & Agents", "context · intent · execution"],
  ["web3", "Web3 & Open Networks", "access · trust · coordination"],
  ["information", "Information & Retrieval", "sources · memory · structure"],
  ["creative", "Creative & Writing", "fiction · process · voice"],
];

const layers = ["infrastructure", "applications", "writing"];
const matrix = document.querySelector("#build-matrix");
const dialog = document.querySelector("#project-dialog");

function makeCard(project) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "project-card";
  card.dataset.project = project.id;
  card.dataset.status = project.status;
  card.setAttribute("aria-label", `${project.name}: ${project.thesis}. Open details.`);
  card.innerHTML = `<strong>${project.name}</strong><span>${project.thesis}</span>`;
  card.addEventListener("click", () => openProject(project));
  card.addEventListener("mouseenter", () => highlightProject(project.id));
  card.addEventListener("focus", () => highlightProject(project.id));
  card.addEventListener("mouseleave", clearHighlight);
  card.addEventListener("blur", clearHighlight);
  return card;
}

for (const [themeId, themeName, themeNote] of themes) {
  const heading = document.createElement("div");
  heading.className = "matrix-row-heading";
  heading.setAttribute("role", "rowheader");
  heading.innerHTML = `<strong>${themeName}</strong><span>${themeNote}</span>`;
  matrix.append(heading);

  for (const layer of layers) {
    const cell = document.createElement("div");
    cell.className = "matrix-cell";
    cell.setAttribute("role", "cell");
    cell.dataset.cell = `${themeId}:${layer}`;
    projects
      .filter((project) => project.cells.some(([theme, projectLayer]) => theme === themeId && projectLayer === layer))
      .forEach((project) => cell.append(makeCard(project)));
    matrix.append(cell);
  }
}

function highlightProject(id) {
  matrix.classList.add("has-active");
  document.querySelectorAll(`[data-project="${id}"]`).forEach((card) => card.classList.add("is-related"));
}

function clearHighlight() {
  matrix.classList.remove("has-active");
  document.querySelectorAll(".project-card.is-related").forEach((card) => card.classList.remove("is-related"));
}

function openProject(project) {
  document.querySelector("#dialog-kicker").textContent = project.tags.slice(0, 2).join(" × ");
  document.querySelector("#dialog-title").textContent = project.name;
  document.querySelector("#dialog-thesis").textContent = project.thesis;
  document.querySelector("#dialog-status").textContent = project.status;
  document.querySelector("#dialog-updated").textContent = project.updated;
  document.querySelector("#dialog-tags").textContent = project.tags.join(" · ");
  document.querySelector("#dialog-role").textContent = project.role;
  const links = document.querySelector("#dialog-links");
  links.replaceChildren();

  if (project.demo) links.append(makeDialogLink("Open live demo ↗", project.demo));
  if (project.repo) links.append(makeDialogLink("Inspect repository ↗", project.repo));
  if (!project.demo && !project.repo) {
    const pending = document.createElement("span");
    pending.className = "button secondary";
    pending.textContent = "Public repository preparing";
    links.append(pending);
  }

  dialog.showModal();
}

function makeDialogLink(label, href) {
  const link = document.createElement("a");
  link.className = "button primary";
  link.href = href;
  link.textContent = label;
  return link;
}

document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

document.querySelectorAll("[data-project-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    const project = projects.find((item) => item.id === button.dataset.projectJump);
    if (project) openProject(project);
  });
});

const featured = projects.filter((project) => project.featured).slice(0, 6);
const projectList = document.querySelector("#project-list");
featured.forEach((project, index) => {
  const row = document.createElement("article");
  row.className = "project-row";
  const action = project.demo
    ? `<a href="${project.demo}">Open ↗</a>`
    : `<button type="button" data-open-project="${project.id}">Details →</button>`;
  row.innerHTML = `
    <span class="index">${String(index + 1).padStart(2, "0")}</span>
    <h3>${project.name}</h3>
    <p>${project.thesis}</p>
    <div class="row-meta"><span class="status-pill">${project.status}</span>${action}</div>
  `;
  projectList.append(row);
});

projectList.querySelectorAll("[data-open-project]").forEach((button) => {
  button.addEventListener("click", () => {
    const project = projects.find((item) => item.id === button.dataset.openProject);
    if (project) openProject(project);
  });
});
