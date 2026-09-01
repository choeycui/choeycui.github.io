const GITHUB_USER = "outisseus";
const FEATURE_TOPIC = "builder-featured";
const curatedProjects = Array.isArray(window.PROJECTS_MANIFEST) ? window.PROJECTS_MANIFEST : [];
const matrixManifest = window.MATRIX_MANIFEST || { columns: [], rows: [] };
let projects = curatedProjects.map((project) => ({ ...project }));

const matrix = document.querySelector("#build-matrix");
const dialog = document.querySelector("#project-dialog");
const projectList = document.querySelector("#project-list");
const syncStatus = document.querySelector("#github-sync-status");

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function repoFactLine(project) {
  return [
    project.language,
    project.updated ? `updated ${project.updated}` : null,
    Number.isFinite(project.stars) ? `★ ${project.stars}` : null,
  ].filter(Boolean).join(" · ");
}

function setMatrixHighlight(projectId) {
  matrix.classList.toggle("has-active", Boolean(projectId));
  matrix.querySelectorAll(".project-card").forEach((card) => {
    card.classList.toggle("is-related", card.dataset.project === projectId);
  });
}

function makeProjectCard(project) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "project-card";
  card.dataset.project = project.id;
  card.dataset.status = project.status;
  card.setAttribute("aria-label", `Open ${project.name} project details`);

  const status = document.createElement("span");
  status.className = "project-card-status";
  status.textContent = project.status;
  const name = document.createElement("strong");
  name.textContent = project.name;
  const thesis = document.createElement("span");
  thesis.className = "project-card-thesis";
  thesis.textContent = project.thesis;
  card.append(status, name, thesis);

  card.addEventListener("mouseenter", () => setMatrixHighlight(project.id));
  card.addEventListener("mouseleave", () => setMatrixHighlight(null));
  card.addEventListener("focus", () => setMatrixHighlight(project.id));
  card.addEventListener("blur", () => setMatrixHighlight(null));
  card.addEventListener("click", () => openProject(project));
  return card;
}

function renderMatrix() {
  matrix.replaceChildren();
  const activeProjects = projects.filter((project) => project.status !== "inactive");

  const header = document.createElement("div");
  header.className = "matrix-head";
  header.setAttribute("role", "row");
  const corner = document.createElement("span");
  corner.className = "matrix-corner";
  corner.setAttribute("role", "columnheader");
  corner.textContent = "Portfolio layer";
  header.append(corner);
  matrixManifest.columns.forEach(([, label]) => {
    const heading = document.createElement("span");
    heading.className = "matrix-column-heading";
    heading.setAttribute("role", "columnheader");
    heading.textContent = label;
    header.append(heading);
  });
  matrix.append(header);

  matrixManifest.rows.forEach(([rowId, rowLabel, rowNote]) => {
    const row = document.createElement("section");
    row.className = "matrix-row";
    row.setAttribute("role", "row");

    const heading = document.createElement("header");
    heading.className = "matrix-row-heading";
    heading.setAttribute("role", "rowheader");
    const title = document.createElement("strong");
    title.textContent = rowLabel;
    const note = document.createElement("span");
    note.textContent = rowNote;
    heading.append(title, note);
    row.append(heading);

    matrixManifest.columns.forEach(([columnId, columnLabel]) => {
      const cell = document.createElement("div");
      cell.className = "matrix-cell";
      cell.dataset.columnLabel = columnLabel;
      cell.setAttribute("role", "cell");
      const cellProjects = activeProjects.filter((project) =>
        Array.isArray(project.cells)
          && project.cells.some(([projectRow, projectColumn]) => projectRow === rowId && projectColumn === columnId),
      );
      if (!cellProjects.length) cell.classList.add("is-empty");
      cellProjects.forEach((project) => cell.append(makeProjectCard(project)));
      row.append(cell);
    });
    matrix.append(row);
  });
}

function openProject(project) {
  document.querySelector("#dialog-kicker").textContent = project.tags.slice(0, 2).join(" × ");
  document.querySelector("#dialog-title").textContent = project.name;
  document.querySelector("#dialog-thesis").textContent = project.thesis;
  document.querySelector("#dialog-status").textContent = project.status;
  document.querySelector("#dialog-updated").textContent = project.updated;
  document.querySelector("#dialog-tags").textContent = project.tags.join(" · ");
  document.querySelector("#dialog-role").textContent = project.role;
  document.querySelector("#dialog-repository").textContent = project.repoDescription || "Curated snapshot; live repository description unavailable.";
  const links = document.querySelector("#dialog-links");
  links.replaceChildren();
  if (project.demo && project.status !== "inactive") {
    links.append(makeDialogLink(project.demoLabel || "Open live demo ↗", project.demo));
  }
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
  link.target = "_blank";
  link.rel = "noreferrer";
  return link;
}

function projectAction(project) {
  if (project.demo || project.repo) {
    const link = document.createElement("a");
    link.href = project.demo || project.repo;
    link.textContent = project.demo ? "Open ↗" : "GitHub ↗";
    link.target = "_blank";
    link.rel = "noreferrer";
    return link;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Details →";
  button.addEventListener("click", () => openProject(project));
  return button;
}

function renderProjectList(featured = projects.filter((project) => project.featured && project.status !== "inactive")) {
  projectList.replaceChildren();
  featured.slice(0, 8).forEach((project, index) => {
    const row = document.createElement("article");
    row.className = "project-row";
    const number = document.createElement("span");
    number.className = "index";
    number.textContent = String(index + 1).padStart(2, "0");
    const title = document.createElement("h3");
    title.textContent = project.name;

    const copy = document.createElement("div");
    copy.className = "project-copy";
    const thesis = document.createElement("p");
    thesis.textContent = project.thesis;
    copy.append(thesis);
    if (project.repoDescription && project.repoDescription !== project.thesis) {
      const repository = document.createElement("small");
      repository.className = "repo-summary";
      repository.textContent = `GitHub · ${project.repoDescription}`;
      copy.append(repository);
    }

    const meta = document.createElement("div");
    meta.className = "row-meta";
    const status = document.createElement("span");
    status.className = "status-pill";
    status.textContent = project.status;
    meta.append(status, projectAction(project));
    const facts = repoFactLine(project);
    if (facts) {
      const factLine = document.createElement("span");
      factLine.className = "repo-facts";
      factLine.textContent = facts;
      meta.append(factLine);
    }
    row.append(number, title, copy, meta);
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
      repo: repo.html_url,
      repoDescription: repo.description || null,
      updated: formatDate(repo.pushed_at),
      language: repo.language,
      stars: repo.stargazers_count,
      topics: repo.topics || [],
      homepage: repo.homepage || null,
      archived: Boolean(repo.archived),
    };
  });

  const curatedSlugs = new Set(
    curatedProjects.filter((project) => project.repoSlug).map((project) => project.repoSlug.toLowerCase()),
  );
  const activeCurated = projects.filter(
    (project) => project.featured && project.status !== "inactive" && !project.archived,
  );
  const discovered = repositories
    .filter((repo) => !repo.fork && !repo.archived)
    .filter((repo) => repo.topics?.includes(FEATURE_TOPIC))
    .filter((repo) => !curatedSlugs.has(repo.name.toLowerCase()))
    .map((repo) => ({
      id: repo.name,
      repoSlug: repo.name,
      name: repo.name,
      thesis: repo.description || "Public repository",
      status: "github",
      updated: formatDate(repo.pushed_at),
      tags: repo.topics || [],
      role: "Public GitHub project loaded from an explicit builder-featured topic.",
      repo: repo.html_url,
      repoDescription: repo.description || null,
      demo: repo.homepage || null,
      featured: true,
      language: repo.language,
      stars: repo.stargazers_count,
      archived: false,
    }));

  renderMatrix();
  renderProjectList([...activeCurated, ...discovered]);
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
    syncStatus.textContent = `Live facts from GitHub · ${repositories.length} public repositories checked`;
    syncStatus.dataset.state = "live";
  } catch (error) {
    renderMatrix();
    renderProjectList();
    syncStatus.textContent = "Curated snapshot · GitHub live facts unavailable";
    syncStatus.dataset.state = "fallback";
  }
}

document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
renderMatrix();
renderProjectList();
syncFromGitHub();
