# User Stories - Detailed Steps

## Purpose
**Convert requirements into user-centered stories with acceptance criteria**

User Stories focus on:
- Translating business requirements into user-centered narratives
- Defining clear acceptance criteria for each story
- Creating user personas that represent different stakeholder types
- Establishing shared understanding across teams
- Providing testable specifications for implementation

## Prerequisites
- Workspace Detection must be complete
- Requirements Analysis recommended (can reference requirements if available)
- Workflow Planning must indicate User Stories stage should execute

## Intelligent Assessment Guidelines

**WHEN TO EXECUTE USER STORIES**: Use this enhanced assessment before proceeding:

### High Priority Execution (ALWAYS Execute)
- **New User Features**: Any new functionality users will directly interact with
- **User Experience Changes**: Modifications to existing user workflows or interfaces
- **Multi-Persona Systems**: Applications serving different types of users
- **Customer-Facing APIs**: Services that external users or systems will consume
- **Complex Business Logic**: Requirements with multiple scenarios or business rules
- **Cross-Team Projects**: Work requiring shared understanding across multiple teams

### Medium Priority Execution (Assess Complexity)
- **Backend User Impact**: Internal changes that indirectly affect user experience
- **Performance Improvements**: Enhancements with user-visible benefits
- **Integration Work**: Connecting systems that affect user workflows
- **Data Changes**: Modifications affecting user data, reports, or analytics
- **Security Enhancements**: Changes affecting user authentication or permissions

### Complexity Assessment Factors
For medium priority cases, execute user stories if ANY of these apply:
- **Scope**: Changes span multiple components or user touchpoints
- **Ambiguity**: Requirements have unclear aspects that stories could clarify
- **Risk**: High business impact or potential for misunderstanding
- **Stakeholders**: Multiple business stakeholders involved in requirements
- **Testing**: User acceptance testing will be required
- **Options**: Multiple valid implementation approaches exist

### Skip Only For Simple Cases
- **Pure Refactoring**: Internal code improvements with zero user impact
- **Isolated Bug Fixes**: Simple, well-defined fixes with clear scope
- **Infrastructure Only**: Changes with no user-facing effects
- **Developer Tooling**: Build processes, CI/CD, or development environment changes
- **Documentation**: Updates that don't affect functionality

### Default Decision Rule
**When in doubt, include user stories AND ask clarifying questions.** The overhead of creating comprehensive stories with proper clarification is typically outweighed by the benefits of:
- Clearer requirements understanding
- Better team alignment
- Improved testing criteria
- Enhanced stakeholder communication
- Reduced implementation risks
- Fewer costly changes during development
- Better user experience outcomes

---

# PART 1: PLANNING

## Step 1: Validate User Stories Need (MANDATORY)

**CRITICAL**: Before proceeding with user stories, perform this assessment:

### Assessment Process
1. **Analyze Request Context**:
   - Review the original user request and requirements
   - Identify user-facing vs internal-only changes
   - Assess complexity and scope of the work
   - Evaluate business stakeholder involvement

2. **Apply Assessment Criteria**:
   - Check against High Priority indicators (always execute)
   - Evaluate Medium Priority factors (complexity-based decision)
   - Confirm this isn't a simple case that should be skipped

3. **Document Assessment Decision**:
   - Create `aidlc-docs/inception/plans/user-stories-assessment.md`
   - Include reasoning for why user stories are valuable for this request
   - Reference specific assessment criteria that apply
   - Explain expected benefits (clarity, testing, stakeholder alignment)

4. **Proceed Only If Justified**:
   - User stories must add clear value to the project
   - Assessment must show concrete benefits outweigh overhead
   - Decision should be defensible to project stakeholders

### Assessment Documentation Template
```markdown
# User Stories Assessment

## Request Analysis
- **Original Request**: [Brief summary]
- **User Impact**: [Direct/Indirect/None]
- **Complexity Level**: [Simple/Medium/Complex]
- **Stakeholders**: [List involved parties]

## Assessment Criteria Met
- [ ] High Priority: [List applicable criteria]
- [ ] Medium Priority: [List applicable criteria with complexity justification]
- [ ] Benefits: [Expected value from user stories]

## Decision
**Execute User Stories**: [Yes/No]
**Reasoning**: [Detailed justification]

## Expected Outcomes
- [List specific benefits user stories will provide]
- [How stories will improve project success]
```

## Step 2: Create Story Plan
- Assume the role of a product owner
- Generate a comprehensive plan with step-by-step execution checklist for story development
- Each step and sub-step should have a checkbox []
- Focus on methodology and approach for converting requirements into user stories

## Step 3: Generate Context-Appropriate Questions
**DIRECTIVE**: Thoroughly analyze the requirements and context to identify ALL areas where clarification would improve story quality and team understanding. Be proactive in asking questions to ensure comprehensive user story development.

**CRITICAL**: Default to asking questions when there is ANY ambiguity or missing detail that could affect story quality. It's better to ask too many questions than to create incomplete or unclear stories.

**See `common/question-format-guide.md` for question formatting rules**

- EMBED questions using [Answer]: tag format
- Focus on ANY ambiguities, missing information, or areas needing clarification
- Generate questions wherever user input would improve story creation decisions
- **When in doubt, ask the question** - overconfidence leads to poor stories

**Question categories to evaluate** (consider ALL categories):
- **User Personas** - Ask about user types, roles, characteristics, and motivations
- **Story Granularity** - Ask about appropriate level of detail, story size, and breakdown approach
- **Story Format** - Ask about format preferences, template usage, and documentation standards
- **Breakdown Approach** - Ask about organization method, prioritization, and grouping strategies
- **Acceptance Criteria** - Ask about detail level, format, testing approach, and validation methods
- **User Journeys** - Ask about user workflows, interaction patterns, and experience flows
- **Business Context** - Ask about business goals, success metrics, and stakeholder needs
- **Technical Constraints** - Ask about technical limitations, integration requirements, and system boundaries

## Step 4: Include Mandatory Story Artifacts in Plan
- **ALWAYS** include these mandatory artifacts in the story plan:
  - [ ] Generate stories.md with user stories following INVEST criteria
  - [ ] Generate personas.md with user archetypes and characteristics
  - [ ] Ensure stories are Independent, Negotiable, Valuable, Estimable, Small, Testable
  - [ ] Include acceptance criteria for each story
  - [ ] Map personas to relevant user stories
  - [ ] Generate stories.html — an interactive, self-contained use-case view of stories.md and personas.md (see Step 17.5)

## Step 5: Present Story Options
- Include different approaches for story breakdown in the plan document:
  - **User Journey-Based**: Stories follow user workflows and interactions
  - **Feature-Based**: Stories organized around system features and capabilities
  - **Persona-Based**: Stories grouped by different user types and their needs
  - **Domain-Based**: Stories organized around business domains or contexts
  - **Epic-Based**: Stories structured as hierarchical epics with sub-stories
- Explain trade-offs and benefits of each approach
- Allow for hybrid approaches with clear decision criteria

## Step 6: Store Story Plan
- Save the complete story plan with embedded questions in `aidlc-docs/inception/plans/` directory
- Filename: `story-generation-plan.md`
- Include all [Answer]: tags for user input
- Ensure plan is comprehensive and covers all story development aspects

## Step 7: Request User Input
- Ask user to fill in all [Answer]: tags directly in the story plan document
- Emphasize importance of audit trail and decision documentation
- Provide clear instructions on how to fill in the [Answer]: tags
- Explain that all questions must be answered before proceeding

## Step 8: Collect Answers
- Wait for user to provide answers to all questions using [Answer]: tags in the document
- Do not proceed until ALL [Answer]: tags are completed
- Review the document to ensure no [Answer]: tags are left blank

## Step 9: ANALYZE ANSWERS (MANDATORY)
Before proceeding, you MUST carefully review all user answers for:
- **Vague or ambiguous responses**: "mix of", "somewhere between", "not sure", "depends", "maybe", "probably"
- **Undefined criteria or terms**: References to concepts without clear definitions
- **Contradictory answers**: Responses that conflict with each other
- **Missing generation details**: Answers that lack specific guidance for implementation
- **Answers that combine options**: Responses that merge different approaches without clear decision rules
- **Incomplete explanations**: Answers that reference external factors without defining them
- **Assumption-based responses**: Answers that assume knowledge not explicitly stated

## Step 10: MANDATORY Follow-up Questions
If the analysis in step 9 reveals ANY ambiguous answers, you MUST:
- Create a separate clarification questions file using [Answer]: tags
- DO NOT proceed to approval until ALL ambiguities are completely resolved
- **CRITICAL**: Be thorough - ask follow-up questions for every unclear response
- Examples of required follow-ups:
  - "You mentioned 'mix of A and B' - what specific criteria should determine when to use A vs B?"
  - "You said 'somewhere between A and B' - can you define the exact middle ground approach?"
  - "You indicated 'not sure' - what additional information would help you decide?"
  - "You mentioned 'depends on complexity' - how do you define complexity levels and thresholds?"
  - "You chose 'hybrid approach' - what are the specific rules for when to use each method?"
  - "You said 'probably X' - what factors would make it definitely X vs definitely not X?"
  - "You referenced 'standard practice' - can you define what that standard practice is?"

## Step 11: Avoid Implementation Details
- Focus on story creation methodology, not prioritization or development tasks
- Do not discuss technical generation at this stage
- Avoid creating development timelines or sprint planning
- Keep focus on story structure and format decisions

## Step 12: Log Approval Prompt
- Before asking for approval, log the prompt with timestamp in `aidlc-docs/audit.md`
- Include the complete approval prompt text
- Use ISO 8601 timestamp format

## Step 13: Wait for Explicit Approval of Plan
- Do not proceed until the user explicitly approves the story approach
- Approval must be clear and unambiguous
- If user requests changes, update the plan and repeat the approval process

## Step 14: Record Approval Response
- Log the user's approval response with timestamp in `aidlc-docs/audit.md`
- Include the exact user response text
- Mark the approval status clearly

---

# PART 2: GENERATION

## Step 15: Load Story Generation Plan
- [ ] Read the complete story plan from `aidlc-docs/inception/plans/story-generation-plan.md`
- [ ] Identify the next uncompleted step (first [ ] checkbox)
- [ ] Load the context and requirements for that step

## Step 16: Execute Current Step
- [ ] Perform exactly what the current step describes
- [ ] Generate story artifacts as specified in the plan
- [ ] Follow the approved methodology and format from Planning
- [ ] Use the story breakdown approach specified in the plan

## Step 17: Update Progress
- [ ] Mark the completed step as [x] in the story generation plan
- [ ] Update `aidlc-docs/aidlc-state.md` current status
- [ ] Save all generated artifacts

## Step 17.5: Generate Interactive HTML View (MANDATORY)

**Purpose**: Produce `aidlc-docs/inception/user-stories/stories.html` — a single, self-contained, interactive use-case view that lets the user review stories comfortably in a browser. It is a **convenience view only**; `stories.md` and `personas.md` remain the single source of truth.

**PREREQUISITE**: `stories.md` and `personas.md` must already be fully generated. Run this step only once, after all other story artifacts are complete.

### Generation Rules
- **Source of truth**: Do NOT re-author or re-summarize the story detail. Copy the acceptance criteria and story bodies **verbatim** from `stories.md`. The HTML is a snapshot of the markdown at generation time.
- **No duplication of authoring effort**: Embed the raw markdown content of `stories.md` and `personas.md` inside the HTML (in the `<script type="text/markdown">` blocks). The interactive detail is rendered from that embedded markdown — you do not write the detail a second time.
- **Self-contained**: All HTML, CSS, and JS must be inline. No external requests, no CDN links, no `fetch()`. It must open correctly from a `file://` double-click in any modern browser.
- **Diagram structure**: The top level shows each persona and, connected to it, boxes for the use cases / stories that persona performs (UML use-case style). Clicking a box reveals that story's full detail (description + acceptance criteria) rendered from the embedded markdown.
- **Mapping**: Derive persona-to-story connections from the persona mapping already present in `stories.md`.
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
- [ ] Mark the artifact complete in the story generation plan.

## Step 18: Continue or Complete Generation
- [ ] If more steps remain, return to Step 15
- [ ] If all steps complete, verify stories are ready for next stage
- [ ] Ensure all mandatory artifacts are generated

## Step 19: Log Approval Prompt
- Before asking for approval, log the prompt with timestamp in `aidlc-docs/audit.md`
- Include the complete approval prompt text
- Use ISO 8601 timestamp format

## Step 20: Present Completion Message
- Present completion message in this structure:
     1. **Completion Announcement** (mandatory): Always start with this:

```markdown
# 📚 User Stories Complete
```

     2. **AI Summary** (optional): Provide structured bullet-point summary of generated stories
        - Format: "User stories generation has created [description]:"
        - List key personas generated (bullet points)
        - List user stories created with counts and organization
        - Mention story structure and compliance (INVEST criteria, acceptance criteria)
        - DO NOT include workflow instructions ("please review", "let me know", "proceed to next phase", "before we proceed")
        - Keep factual and content-focused
     3. **Formatted Workflow Message** (mandatory): Always end with this exact format:

```markdown
> **📋 <u>**REVIEW REQUIRED:**</u>**  
> Please examine the user stories and personas at: `aidlc-docs/inception/user-stories/stories.md` and `aidlc-docs/inception/user-stories/personas.md`
>
> 💡 **For easier review**, open `aidlc-docs/inception/user-stories/stories.html` in your browser (just double-click it). It shows each persona and the use cases they perform — click any box to see that story's full detail and acceptance criteria. The HTML is a convenience view; `stories.md` remains the source of truth.



> **🚀 <u>**WHAT'S NEXT?**</u>**
>
> **You may:**
>
> 🔧 **Request Changes** -  Ask for modifications to the stories or personas based on your review  
> ✅ **Approve & Continue** - Approve user stories and proceed to **Workflow Planning**

---
```

## Step 21: Wait for Explicit Approval of Generated Stories
- Do not proceed until the user explicitly approves the generated stories
- Approval must be clear and unambiguous
- If user requests changes, update stories and repeat the approval process

## Step 22: Record Approval Response
- Log the user's approval response with timestamp in `aidlc-docs/audit.md`
- Include the exact user response text
- Mark the approval status clearly

## Step 23: Update Progress
- Mark User Stories stage complete in `aidlc-state.md`
- Update the "Current Status" section
- Prepare for transition to next stage

---

# CRITICAL RULES

## Planning Phase Rules
- **CONTEXT-APPROPRIATE QUESTIONS**: Only ask questions relevant to this specific context
- **MANDATORY ANSWER ANALYSIS**: Always analyze answers for ambiguities before proceeding
- **NO PROCEEDING WITH AMBIGUITY**: Must resolve all vague answers before generation
- **EXPLICIT APPROVAL REQUIRED**: User must approve plan before generation starts

## Generation Phase Rules
- **NO HARDCODED LOGIC**: Only execute what's written in the story generation plan
- **FOLLOW PLAN EXACTLY**: Do not deviate from the step sequence
- **UPDATE CHECKBOXES**: Mark [x] immediately after completing each step
- **USE APPROVED METHODOLOGY**: Follow the story approach from Planning
- **VERIFY COMPLETION**: Ensure all story artifacts are complete before proceeding

## Completion Criteria
- All planning questions answered and ambiguities resolved
- Story plan explicitly approved by user
- All steps in story generation plan marked [x]
- All story artifacts generated according to plan (stories.md, personas.md, stories.html)
- Generated stories explicitly approved by user
- Stories verified and ready for next stage
