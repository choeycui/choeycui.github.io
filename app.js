const GITHUB_USER = "outisseus";
const FEATURE_TOPIC = "builder-featured";
const curatedPrograms = Array.isArray(window.PROGRAMS_MANIFEST) ? window.PROGRAMS_MANIFEST : [];
const curatedProjects = Array.isArray(window.PROJECTS_MANIFEST) ? window.PROJECTS_MANIFEST : [];
let projects = curatedProjects.map((project) => ({ ...project }));
let programs = curatedPrograms.map((program) => ({ ...program }));

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

function makeEvidenceLink(item) {
  const link = document.createElement("a");
  link.href = item.href;
  link.textContent = `${item.label} ↗`;
  link.target = "_blank";
  link.rel = "noreferrer";
  return link;
}

function renderMatrix() {
  matrix.replaceChildren();

  const header = document.createElement("div");
  header.className = "program-matrix-head";
  header.setAttribute("role", "row");
  ["Program", "Boundary question", "Enduring core", "Building now", "Public evidence"].forEach((label) => {
    const cell = document.createElement("span");
    cell.setAttribute("role", "columnheader");
    cell.textContent = label;
    header.append(cell);
  });
  matrix.append(header);

  programs.forEach((program) => {
    const project = projects.find((item) => item.id === program.projectId);
    const row = document.createElement("article");
    row.className = `program-row is-${program.tone}`;
    row.dataset.program = program.id;
    row.setAttribute("role", "row");

    const heading = document.createElement("div");
    heading.className = "program-heading";
    heading.setAttribute("role", "rowheader");
    const mode = document.createElement("span");
    mode.className = "program-mode";
    mode.textContent = program.mode;
    const name = document.createElement("button");
    name.type = "button";
    name.className = "program-name";
    name.textContent = program.name;
    name.addEventListener("click", () => project && openProject(project));
    heading.append(mode, name);

    const boundary = makeMatrixCell("Boundary question", program.boundary, "program-boundary");

    const core = document.createElement("div");
    core.className = "program-cell program-core";
    core.setAttribute("role", "cell");
    core.append(makeCellLabel("Enduring core"));
    const list = document.createElement("ul");
    program.core.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });
    core.append(list);

    const building = makeMatrixCell("Building now", program.building, "program-building");

    const evidence = document.createElement("div");
    evidence.className = "program-cell program-evidence";
    evidence.setAttribute("role", "cell");
    evidence.append(makeCellLabel("Public evidence"));
    const links = document.createElement("div");
    links.className = "program-links";
    program.evidence.forEach((item) => links.append(makeEvidenceLink(item)));
    evidence.append(links);
    if (project) {
      const facts = document.createElement("small");
      facts.className = "program-repo-facts";
      facts.textContent = repoFactLine(project) || "Curated repository snapshot";
      evidence.append(facts);
    }

    row.append(heading, boundary, core, building, evidence);
    matrix.append(row);
  });
}

function makeCellLabel(label) {
  const element = document.createElement("span");
  element.className = "program-cell-label";
  element.textContent = label;
  return element;
}

function makeMatrixCell(label, copy, className) {
  const cell = document.createElement("div");
  cell.className = `program-cell ${className}`;
  cell.setAttribute("role", "cell");
  const text = document.createElement("p");
  text.textContent = copy;
  cell.append(makeCellLabel(label), text);
  return cell;
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

  programs = curatedPrograms.map((program) => {
    const project = projects.find((item) => item.id === program.projectId);
    return project ? { ...program, repositoryUpdated: project.updated } : { ...program };
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
document.querySelectorAll("[data-project-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    const project = projects.find((item) => item.id === button.dataset.projectJump);
    if (project) openProject(project);
  });
});

renderMatrix();
renderProjectList();
syncFromGitHub();
