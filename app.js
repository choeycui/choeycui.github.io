const GITHUB_USER = "outisseus";
const FEATURE_TOPIC = "builder-featured";
const themes = [
  ["ai", "AI & Agents", "context · intent · execution"],
  ["web3", "Open Networks", "access · trust · coordination"],
  ["information", "Information & Retrieval", "sources · memory · structure"],
  ["creative", "Creative & Writing", "fiction · process · voice"],
];
const layers = ["infrastructure", "applications", "writing"];
const curatedProjects = Array.isArray(window.PROJECTS_MANIFEST) ? window.PROJECTS_MANIFEST : [];
let projects = curatedProjects.map((project) => ({ ...project }));

const matrix = document.querySelector("#build-matrix");
const dialog = document.querySelector("#project-dialog");
const projectList = document.querySelector("#project-list");
const syncStatus = document.querySelector("#github-sync-status");

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

function makeCard(project) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "project-card";
  card.dataset.project = project.id;
  card.dataset.status = project.status;
  card.setAttribute("aria-label", `${project.name}: ${project.thesis}. Open details.`);
  const name = document.createElement("strong");
  name.textContent = project.name;
  const thesis = document.createElement("span");
  thesis.textContent = project.thesis;
  card.append(name, thesis);
  card.addEventListener("click", () => openProject(project));
  card.addEventListener("mouseenter", () => highlightProject(project.id));
  card.addEventListener("focus", () => highlightProject(project.id));
  card.addEventListener("mouseleave", clearHighlight);
  card.addEventListener("blur", clearHighlight);
  return card;
}

function renderMatrix() {
  matrix.querySelectorAll(".matrix-row-heading, .matrix-cell").forEach((element) => element.remove());
  for (const [themeId, themeName, themeNote] of themes) {
    const heading = document.createElement("div");
    heading.className = "matrix-row-heading";
    heading.setAttribute("role", "rowheader");
    const name = document.createElement("strong");
    name.textContent = themeName;
    const note = document.createElement("span");
    note.textContent = themeNote;
    heading.append(name, note);
    matrix.append(heading);

    for (const layer of layers) {
      const cell = document.createElement("div");
      cell.className = "matrix-cell";
      cell.setAttribute("role", "cell");
      cell.dataset.cell = `${themeId}:${layer}`;
      projects
        .filter((project) => project.cells?.some(([theme, projectLayer]) => theme === themeId && projectLayer === layer))
        .forEach((project) => cell.append(makeCard(project)));
      matrix.append(cell);
    }
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
  if (project.demo) links.append(makeDialogLink(project.demoLabel || "Open live demo ↗", project.demo));
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

function projectAction(project) {
  const link = document.createElement("a");
  link.href = project.demo || project.repo;
  link.textContent = project.demo ? "Open ↗" : "GitHub ↗";
  if (project.demo || project.repo) return link;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Details →";
  button.addEventListener("click", () => openProject(project));
  return button;
}

function renderProjectList(featured = projects.filter((project) => project.featured)) {
  projectList.replaceChildren();
  featured.slice(0, 8).forEach((project, index) => {
    const row = document.createElement("article");
    row.className = "project-row";
    const number = document.createElement("span");
    number.className = "index";
    number.textContent = String(index + 1).padStart(2, "0");
    const title = document.createElement("h3");
    title.textContent = project.name;
    const thesis = document.createElement("p");
    thesis.textContent = project.thesis;
    const meta = document.createElement("div");
    meta.className = "row-meta";
    const status = document.createElement("span");
    status.className = "status-pill";
    status.textContent = project.status;
    meta.append(status, projectAction(project));
    if (project.language || Number.isFinite(project.stars)) {
      const facts = document.createElement("span");
      facts.className = "repo-facts";
      facts.textContent = [project.language, Number.isFinite(project.stars) ? `★ ${project.stars}` : null].filter(Boolean).join(" · ");
      meta.append(facts);
    }
    row.append(number, title, thesis, meta);
    projectList.append(row);
  });
}

function mergeGitHubData(repositories) {
  const byName = new Map(repositories.map((repo) => [repo.name.toLowerCase(), repo]));
  projects = curatedProjects.map((project) => {
    const repo = project.repoSlug ? byName.get(project.repoSlug.toLowerCase()) : null;
    if (!repo) return { ...project };
    return {
      ...project,
      thesis: repo.description || project.thesis,
      updated: formatDate(repo.pushed_at),
      repo: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      topics: repo.topics || [],
    };
  });

  const curatedBySlug = new Map(projects.filter((project) => project.repoSlug).map((project) => [project.repoSlug.toLowerCase(), project]));
  const githubFeatured = repositories
    .filter((repo) => !repo.fork && !repo.archived && repo.topics?.includes(FEATURE_TOPIC))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .map((repo) => curatedBySlug.get(repo.name.toLowerCase()) || {
      id: repo.name,
      repoSlug: repo.name,
      name: repo.name,
      thesis: repo.description || "Public repository",
      status: "github",
      updated: formatDate(repo.pushed_at),
      tags: repo.topics || [],
      role: "Public GitHub project loaded from the repository profile.",
      repo: repo.html_url,
      demo: repo.homepage || null,
      featured: true,
      cells: [],
      language: repo.language,
      stars: repo.stargazers_count,
    });
  renderMatrix();
  renderProjectList(githubFeatured.length ? githubFeatured : projects.filter((project) => project.featured));
}

async function syncFromGitHub() {
  syncStatus.textContent = "Syncing public repository facts…";
  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const repositories = await response.json();
    mergeGitHubData(repositories);
    syncStatus.textContent = `Live from GitHub · ${repositories.length} public repositories checked`;
    syncStatus.dataset.state = "live";
  } catch (error) {
    syncStatus.textContent = "Curated snapshot · GitHub live sync unavailable";
    syncStatus.dataset.state = "fallback";
  }
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

renderMatrix();
renderProjectList();
syncFromGitHub();
