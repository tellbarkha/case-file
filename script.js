// Case File — Clinical Trial Explorer
// Talks directly to the public ClinicalTrials.gov API v2 (no key required).
// Docs: https://clinicaltrials.gov/data-api/api

const API_BASE = "https://clinicaltrials.gov/api/v2/studies";
const PAGE_SIZE = 12;

const els = {
  form: document.getElementById("search-form"),
  input: document.getElementById("condition-input"),
  chips: document.getElementById("example-chips"),
  filters: document.getElementById("status-filters"),
  results: document.getElementById("results"),
  emptyState: document.getElementById("empty-state"),
  pager: document.getElementById("pager"),
  loadMoreBtn: document.getElementById("load-more"),
  resultCount: document.getElementById("result-count"),
  folder: document.getElementById("folder"),
  folderScrim: document.getElementById("folder-scrim"),
  folderContent: document.getElementById("folder-content"),
  folderClose: document.getElementById("folder-close"),
};

let state = {
  condition: "",
  nextPageToken: null,
  totalCount: 0,
  loadedCount: 0,
};

// ---------- helpers ----------

function selectedStatuses() {
  return Array.from(els.filters.querySelectorAll('input[type="checkbox"]:checked')).map(
    (cb) => cb.value
  );
}

function statusStampClass(status) {
  switch (status) {
    case "RECRUITING":
      return "stamp--recruiting";
    case "ACTIVE_NOT_RECRUITING":
    case "ENROLLING_BY_INVITATION":
      return "stamp--active";
    case "COMPLETED":
      return "stamp--completed";
    case "NOT_YET_RECRUITING":
      return "stamp--pending";
    default:
      return "stamp--other";
  }
}

function statusLabel(status) {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function phaseLabel(phases) {
  if (!phases || !phases.length || phases[0] === "NA") return "N/A";
  return phases.map((p) => p.replace("PHASE", "Phase ")).join(" / ");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function buildUrl(pageToken) {
  const params = new URLSearchParams();
  params.set("query.cond", state.condition);
  params.set("pageSize", String(PAGE_SIZE));
  params.set("format", "json");
  params.set("countTotal", "true");
  const statuses = selectedStatuses();
  if (statuses.length) {
    params.set("filter.overallStatus", statuses.join(","));
  }
  if (pageToken) params.set("pageToken", pageToken);
  return `${API_BASE}?${params.toString()}`;
}

// ---------- skeleton ----------

function renderSkeletons(count) {
  els.emptyState.hidden = true;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "card card--skeleton";
    div.innerHTML = `
      <div class="card__top">
        <div class="redact redact--w40" style="height:11px;"></div>
        <div class="redact redact--stamp"></div>
      </div>
      <div class="redact redact--title"></div>
      <div class="redact redact--w70" style="height:16px;"></div>
      <div class="redact redact--w60" style="height:11px;"></div>
      <div class="redact redact--w95" style="height:11px;"></div>
      <div class="redact redact--w70" style="height:11px;"></div>
    `;
    frag.appendChild(div);
  }
  els.results.appendChild(frag);
}

function clearSkeletons() {
  els.results.querySelectorAll(".card--skeleton").forEach((el) => el.remove());
}

// ---------- rendering ----------

function studyToCardData(study) {
  const p = study.protocolSection || {};
  const id = p.identificationModule || {};
  const status = p.statusModule || {};
  const design = p.designModule || {};
  const desc = p.descriptionModule || {};
  const cond = p.conditionsModule || {};
  const loc = p.contactsLocationsModule || {};
  return {
    nctId: id.nctId,
    title: id.briefTitle || id.officialTitle || "Untitled study",
    officialTitle: id.officialTitle,
    status: status.overallStatus,
    phase: phaseLabel(design.phases),
    enrollment: design.enrollmentInfo?.count,
    conditions: cond.conditions || [],
    summary: desc.briefSummary || "No summary provided.",
    eligibility: p.eligibilityModule?.eligibilityCriteria || "",
    minAge: p.eligibilityModule?.minimumAge,
    maxAge: p.eligibilityModule?.maximumAge,
    sex: p.eligibilityModule?.sex,
    sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name,
    startDate: status.startDateStruct?.date,
    completionDate: status.completionDateStruct?.date,
    locations: (loc.locations || []).slice(0, 6),
    studyType: design.studyType,
  };
}

function renderCard(study) {
  const d = studyToCardData(study);
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open case file for ${d.title}`);

  card.innerHTML = `
    <div class="card__top">
      <span class="card__nct">${escapeHtml(d.nctId || "NCT—")}</span>
      <span class="stamp ${statusStampClass(d.status)}">${escapeHtml(statusLabel(d.status))}</span>
    </div>
    <h3 class="card__title">${escapeHtml(d.title)}</h3>
    <div class="card__meta">
      <span><b>Phase</b> ${escapeHtml(d.phase)}</span>
      ${d.enrollment ? `<span><b>N</b> ${escapeHtml(String(d.enrollment))}</span>` : ""}
      ${d.locations[0]?.country ? `<span><b>Site</b> ${escapeHtml(d.locations[0].country)}</span>` : ""}
    </div>
    <p class="card__summary">${escapeHtml(d.summary)}</p>
    <div class="card__footer">
      <span>${escapeHtml((d.conditions[0] || "").slice(0, 40))}</span>
      <span>Open case file &rarr;</span>
    </div>
  `;

  const open = () => openFolder(d);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });

  els.results.appendChild(card);
}

function showEmptyState({ error = false, message } = {}) {
  els.emptyState.hidden = false;
  els.emptyState.classList.toggle("empty-state--error", error);
  els.emptyState.innerHTML = `
    <div class="empty-state__stamp">${error ? "NO&nbsp;SIGNAL" : "AWAITING<br>INPUT"}</div>
    <p>${message}</p>
  `;
}

// ---------- folder (detail panel) ----------

function openFolder(d) {
  const eligibilityLines = (d.eligibility || "No eligibility criteria listed.")
    .split("\n")
    .filter(Boolean)
    .map((l) => escapeHtml(l))
    .join("\n");

  const locationsHtml = d.locations.length
    ? `<ul class="locations-list">${d.locations
        .map(
          (loc) =>
            `<li>${escapeHtml(loc.facility || "Facility")} — ${escapeHtml(
              [loc.city, loc.state, loc.country].filter(Boolean).join(", ")
            )}${loc.status ? ` <span style="color:var(--ink-faint)">(${escapeHtml(statusLabel(loc.status))})</span>` : ""}</li>`
        )
        .join("")}</ul>`
    : `<p>No site details listed for this record.</p>`;

  els.folderContent.innerHTML = `
    <span class="stamp ${statusStampClass(d.status)}">${escapeHtml(statusLabel(d.status))}</span>
    <div class="folder__id" style="margin-top:10px;">${escapeHtml(d.nctId || "")}</div>
    <h2>${escapeHtml(d.title)}</h2>

    <dl class="folder__grid">
      <div><dt>Phase</dt><dd>${escapeHtml(d.phase)}</dd></div>
      <div><dt>Study type</dt><dd>${escapeHtml(d.studyType || "—")}</dd></div>
      <div><dt>Enrollment</dt><dd>${d.enrollment ? escapeHtml(String(d.enrollment)) : "—"}</dd></div>
      <div><dt>Sex</dt><dd>${escapeHtml(d.sex || "All")}</dd></div>
      <div><dt>Min age</dt><dd>${escapeHtml(d.minAge || "N/A")}</dd></div>
      <div><dt>Max age</dt><dd>${escapeHtml(d.maxAge || "N/A")}</dd></div>
      <div><dt>Start date</dt><dd>${escapeHtml(d.startDate || "—")}</dd></div>
      <div><dt>Est. completion</dt><dd>${escapeHtml(d.completionDate || "—")}</dd></div>
    </dl>

    <div class="folder__section">
      <h3>Summary</h3>
      <p>${escapeHtml(d.summary)}</p>
    </div>

    <div class="folder__section">
      <h3>Sponsor</h3>
      <p>${escapeHtml(d.sponsor || "Not listed")}</p>
    </div>

    <div class="folder__section">
      <h3>Eligibility criteria</h3>
      <div class="criteria-block">${eligibilityLines}</div>
    </div>

    <div class="folder__section">
      <h3>Locations</h3>
      ${locationsHtml}
    </div>

    <a class="folder__link" href="https://clinicaltrials.gov/study/${encodeURIComponent(
      d.nctId || ""
    )}" target="_blank" rel="noopener">View full official record on ClinicalTrials.gov &rarr;</a>
  `;

  els.folder.classList.add("open");
  els.folderScrim.classList.add("open");
  els.folder.setAttribute("aria-hidden", "false");
}

function closeFolder() {
  els.folder.classList.remove("open");
  els.folderScrim.classList.remove("open");
  els.folder.setAttribute("aria-hidden", "true");
}

els.folderClose.addEventListener("click", closeFolder);
els.folderScrim.addEventListener("click", closeFolder);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeFolder();
});

// ---------- search flow ----------

async function runSearch(condition, { append = false } = {}) {
  if (!append) {
    state.condition = condition;
    state.nextPageToken = null;
    state.loadedCount = 0;
    els.results.innerHTML = "";
    els.emptyState.hidden = true;
    els.pager.hidden = true;
  }

  renderSkeletons(append ? 6 : 9);
  els.loadMoreBtn.disabled = true;
  els.loadMoreBtn.textContent = "Pulling records…";

  try {
    const url = buildUrl(state.nextPageToken);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Registry responded ${res.status}`);
    const data = await res.json();

    clearSkeletons();

    const studies = data.studies || [];
    state.totalCount = data.totalCount ?? state.totalCount;
    state.nextPageToken = data.nextPageToken || null;
    state.loadedCount += studies.length;

    if (!studies.length && !append) {
      showEmptyState({
        message: `No trials found for "${escapeHtml(
          condition
        )}" with the current status filters. Try a broader term or a different filter.`,
      });
      els.pager.hidden = true;
      return;
    }

    studies.forEach(renderCard);

    els.pager.hidden = false;
    els.loadMoreBtn.hidden = !state.nextPageToken;
    els.resultCount.textContent = state.totalCount
      ? `${state.loadedCount.toLocaleString()} of ${state.totalCount.toLocaleString()} case files loaded`
      : "";
  } catch (err) {
    clearSkeletons();
    console.error(err);
    if (!append) {
      showEmptyState({
        error: true,
        message: `Could not reach the ClinicalTrials.gov registry (${escapeHtml(
          err.message
        )}). If you're running this file directly from disk, try serving it over a local server, or check your network connection.`,
      });
    }
    els.pager.hidden = true;
  } finally {
    els.loadMoreBtn.disabled = false;
    els.loadMoreBtn.textContent = "Pull Next Batch";
  }
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = els.input.value.trim();
  if (!value) return;
  runSearch(value);
});

els.chips.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  els.input.value = btn.dataset.value;
  runSearch(btn.dataset.value);
});

els.filters.addEventListener("change", () => {
  if (state.condition) runSearch(state.condition);
});

els.loadMoreBtn.addEventListener("click", () => {
  if (state.condition) runSearch(state.condition, { append: true });
});
