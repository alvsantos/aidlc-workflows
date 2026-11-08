# User Stories — Generation Sub-Procedure

## Purpose
**Produce user-centered stories, personas, and an interactive review view as part of Requirements Analysis.**

This is **not a standalone stage**. User stories no longer have their own planning/approval gates. Requirements Analysis (`inception/requirements-analysis.md`) invokes this sub-procedure so that requirements and stories are clarified in a single question round and approved in a single gate.

This file defines:
- **Section A — Value Assessment**: how Requirements Analysis decides whether to generate stories at all.
- **Section B — Question Inputs**: the story dimensions Requirements Analysis folds into its single, optimized question set (no duplication).
- **Section C — Generation**: how to generate `stories.md`, `personas.md`, and `stories.html`.

Artifacts are written to `aidlc-docs/inception/user-stories/`. `stories.md` and `personas.md` remain the source of truth; `stories.html` is a convenience view.

---

# SECTION A: VALUE ASSESSMENT

Requirements Analysis uses this to decide whether user stories add value for the current request. Generate stories when ANY High Priority indicator applies, or when a Medium Priority case meets a complexity factor. Skip only for clearly story-free work.

## Generate Stories (High Priority — always)
- **New User Features**: New functionality users will directly interact with
- **User Experience Changes**: Changes to existing user workflows or interfaces
- **Multi-Persona Systems**: Applications serving different types of users
- **Customer-Facing APIs**: Services external users or systems consume
- **Complex Business Logic**: Multiple scenarios or business rules
- **Cross-Team Projects**: Work needing shared understanding across teams

## Assess Complexity (Medium Priority)
Generate stories if ANY apply: changes span multiple components/touchpoints; requirements have unclear aspects stories could clarify; high business impact or risk of misunderstanding; multiple stakeholders; user acceptance testing required; multiple valid implementation approaches.

## Skip Stories (story-free work)
- Pure refactoring with zero user impact
- Isolated, well-defined bug fixes
- Infrastructure-only changes
- Developer tooling (build, CI/CD, environment)
- Documentation-only updates

**Default**: when in doubt and any user-facing surface exists, generate stories.

---

# SECTION B: QUESTION INPUTS (fold into the single Requirements question set)

When stories will be generated, Requirements Analysis MUST cover the story dimensions below **within its single, optimized question file** — asking each concept only once. Do NOT create a second question round for stories, and do NOT restate a question already asked for functional requirements in story language.

Story dimensions to ensure are covered (only where not already settled by the requirements questions):
- **User Personas** — the distinct user types/roles and their goals
- **Story Granularity** — expected level of detail / story size
- **Acceptance Criteria** — detail level and how success is validated
- **User Journeys** — key workflows and interaction flows
- **Breakdown/Organization** — how stories should be grouped (journey, feature, persona, domain, or epic based), if it affects output

**Deduplication rule**: Functional-requirement questions and story questions overlap heavily. Merge them. For example, a single question about "what the user needs to accomplish and how you'll know it's done" serves both the functional requirement and its acceptance criteria — ask it once.

---

# SECTION C: GENERATION

Run these steps during Requirements Analysis generation, after `requirements.md` is produced and only if Section A decided to generate stories. There is NO separate approval here — the combined Requirements Analysis gate covers these artifacts.

## C.1 Generate personas.md
- Create `aidlc-docs/inception/user-stories/personas.md`
- Capture each distinct user archetype: role, goals, characteristics, motivations
- Derive personas from the requirements and the answered questions

## C.2 Generate stories.md
- Create `aidlc-docs/inception/user-stories/stories.md`
- Write user stories following **INVEST** (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- Include **acceptance criteria** for each story
- Map each persona to its relevant stories
- Use the breakdown/organization approach indicated by the answers (journey, feature, persona, domain, or epic based)
- Give each story a stable id/anchor (e.g., `US-001`) for traceability

## C.3 Generate stories.html (interactive review view)

Generate `aidlc-docs/inception/user-stories/stories.html` — a single, self-contained, interactive use-case view of `stories.md` and `personas.md`. It is a **convenience view only**; the markdown remains the source of truth.

### Generation Rules
- **Source of truth**: Do NOT re-author or re-summarize the story detail. Copy the acceptance criteria and story bodies **verbatim** from `stories.md`. The HTML is a snapshot of the markdown at generation time.
- **No duplication of authoring effort**: Embed the raw markdown content of `stories.md` and `personas.md` inside the HTML (in the `<script type="text/markdown">` blocks). The interactive detail is rendered from that embedded markdown — you do not write the detail a second time.
- **Self-contained**: All HTML, CSS, and JS must be inline. No external requests, no CDN links, no `fetch()`. It must open correctly from a `file://` double-click in any modern browser.
- **Diagram structure**: The top level shows each persona and, connected to it, boxes for the use cases / stories that persona performs (UML use-case style). Clicking a box reveals that story's full detail (description + acceptance criteria) rendered from the embedded markdown.
- **Mapping**: Derive persona-to-story connections from the persona mapping present in `stories.md`.
- **IDs**: Each story box must carry a stable id matching the story's identifier/anchor in `stories.md` so its embedded section can be located on click.

### Template Skeleton
Inject the data and the two raw markdown documents into this skeleton. Keep the structure; adapt only the injected data.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>User Stories — Interactive Review</title>
<style>
  :root { --bg:#f7f8fa; --ink:#1b1f24; --box:#fff; --accent:#2563eb; --line:#cbd5e1; }
  body { margin:0; font:15px/1.5 system-ui,sans-serif; color:var(--ink); background:var(--bg); }
  header { padding:1rem 1.5rem; background:var(--box); border-bottom:1px solid var(--line); }
  header h1 { margin:0; font-size:1.1rem; }
  header p { margin:.25rem 0 0; color:#64748b; font-size:.85rem; }
  .board { display:flex; flex-wrap:wrap; gap:1.5rem; padding:1.5rem; }
  .persona { background:var(--box); border:1px solid var(--line); border-radius:10px; padding:1rem; min-width:260px; flex:1 1 280px; }
  .persona h2 { margin:0 0 .25rem; font-size:1rem; }
  .persona .role { color:#64748b; font-size:.8rem; margin-bottom:.75rem; }
  .usecase { display:block; width:100%; text-align:left; background:#eef2ff; border:1px solid #c7d2fe;
             border-radius:8px; padding:.5rem .75rem; margin:.4rem 0; cursor:pointer; font:inherit; }
  .usecase:hover { border-color:var(--accent); }
  dialog { border:none; border-radius:12px; max-width:720px; width:90%; padding:0; }
  dialog .head { display:flex; justify-content:space-between; align-items:center;
                 padding:1rem 1.25rem; border-bottom:1px solid var(--line); }
  dialog .head h3 { margin:0; font-size:1rem; }
  dialog .body { padding:1.25rem; max-height:70vh; overflow:auto; }
  dialog button.close { border:none; background:none; font-size:1.25rem; cursor:pointer; }
  .md h1,.md h2,.md h3 { margin:.6rem 0 .3rem; }
  .md code { background:#f1f5f9; padding:.1rem .3rem; border-radius:4px; }
  .md ul { margin:.3rem 0 .3rem 1.2rem; }
</style>
</head>
<body>
<header>
  <h1>User Stories — Interactive Review</h1>
  <p>Convenience view. Source of truth: <code>stories.md</code> and <code>personas.md</code>.</p>
</header>

<!-- INJECT: one .persona block per persona; one .usecase button per story that persona performs.
     data-story must match the story id/anchor used in the embedded markdown. -->
<main class="board" id="board">
  <!-- Example:
  <section class="persona">
    <h2>Shopper</h2>
    <div class="role">Buys products from the catalog</div>
    <button class="usecase" data-story="us-001">US-001 — Search the catalog</button>
  </section>
  -->
</main>

<dialog id="detail">
  <div class="head"><h3 id="detail-title"></h3><button class="close" aria-label="Close">×</button></div>
  <div class="body md" id="detail-body"></div>
</dialog>

<!-- INJECT: paste the raw, unmodified contents of the two markdown files below. -->
<script type="text/markdown" id="stories-md"><!-- RAW stories.md HERE --></script>
<script type="text/markdown" id="personas-md"><!-- RAW personas.md HERE --></script>

<script>
  // Minimal, dependency-free markdown renderer (headings, bold, inline code, lists).
  function renderMarkdown(src){
    const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const lines = esc(src).split('\n'); let html=''; let inList=false;
    for (let ln of lines){
      const li = ln.match(/^\s*[-*]\s+(.*)/);
      if (li){ if(!inList){html+='<ul>';inList=true;} html+='<li>'+inline(li[1])+'</li>'; continue; }
      if (inList){ html+='</ul>'; inList=false; }
      const h = ln.match(/^(#{1,6})\s+(.*)/);
      if (h){ const n=h[1].length; html+='<h'+n+'>'+inline(h[2])+'</h'+n+'>'; continue; }
      if (ln.trim()==='') { html+='<br>'; continue; }
      html+='<p>'+inline(ln)+'</p>';
    }
    if (inList) html+='</ul>';
    return html;
    function inline(s){ return s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`(.+?)`/g,'<code>$1</code>'); }
  }
  // Extract one story's section from the embedded markdown by its id/anchor heading.
  function sectionFor(storyId){
    const md = document.getElementById('stories-md').textContent;
    const lines = md.split('\n'); const out=[]; let capture=false; let level=0;
    for (let ln of lines){
      const h = ln.match(/^(#{1,6})\s+(.*)/);
      if (h){
        const headingId = h[2].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        if (capture && h[1].length<=level) break;              // next sibling/parent heading ends the section
        if (!capture && headingId.includes(storyId.toLowerCase())){ capture=true; level=h[1].length; }
      }
      if (capture) out.push(ln);
    }
    return out.join('\n') || '_Story detail not found in stories.md._';
  }
  const dlg = document.getElementById('detail');
  document.getElementById('board').addEventListener('click', e => {
    const b = e.target.closest('.usecase'); if(!b) return;
    document.getElementById('detail-title').textContent = b.textContent;
    document.getElementById('detail-body').innerHTML = renderMarkdown(sectionFor(b.dataset.story));
    dlg.showModal();
  });
  dlg.querySelector('.close').addEventListener('click', ()=>dlg.close());
</script>
</body>
</html>
```

### After Generation
- [ ] Verify the HTML opens from a `file://` double-click and that clicking a use-case box shows the matching story detail.
- [ ] Confirm the embedded markdown is a verbatim copy of `stories.md` / `personas.md` (no edits, no summaries).

---

# CRITICAL RULES
- **NO SEPARATE GATE**: Stories are reviewed and approved in the single Requirements Analysis gate. Do not add a user-stories planning or generation approval step.
- **SINGLE QUESTION SET**: Story questions are folded into the Requirements Analysis question file, deduplicated. Never open a second question round for stories.
- **INVEST + ACCEPTANCE CRITERIA**: Every story is Independent, Negotiable, Valuable, Estimable, Small, Testable, with explicit acceptance criteria.
- **SOURCE OF TRUTH**: `stories.md`/`personas.md` are canonical; `stories.html` is a verbatim-embedded convenience view.
