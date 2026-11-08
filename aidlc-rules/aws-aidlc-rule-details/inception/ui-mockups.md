# UI Mockups - Detailed Steps

## Purpose
**Produce interactive, navigable UI mockups as a Single-Page Application (SPA) so the user can review the proposed interface before implementation begins.**

UI Mockups focus on:
- Turning user stories and personas into concrete, clickable screens
- Letting stakeholders experience navigation and layout early, while changes are cheap
- Honoring a provided design system so mockups match the intended look and feel
- Producing a review artifact only — not production code

**Note**: Mockups are a review artifact in `aidlc-docs/`. They are NOT the application frontend. Construction (Code Generation) produces the real frontend and MAY use these mockups as a visual reference.

## Prerequisites
- Requirements Analysis must be complete (screens and flows are derived from the requirements and the user stories it produces)
- User stories recommended (produced in Requirements Analysis; screens and flows are derived from stories and personas)
- Runs immediately after Requirements Analysis, before Workflow Planning and Application Design

## When To Execute

**Execute IF** the project has a user-facing interface, for example:
- New screens, pages, or views users will interact with
- Changes to existing user workflows or layouts
- Multi-persona systems where navigation differs by role

**Skip IF**:
- Backend-only, API-only, CLI, or library work with no UI
- Pure refactoring, infrastructure, or configuration changes

When in doubt and any user-facing surface exists, execute.

---

# PART 1: PREPARATION

## Step 1: Confirm UI Scope
- [ ] Load `stories.md` and `personas.md` (if available) and the requirements document
- [ ] Identify the set of screens/views implied by the stories, grouped by persona and user journey
- [ ] Identify the primary navigation between screens

## Step 2: Detect the Design System (MANDATORY)

Determine whether the user has provided a design system, checking these sources in order and using what is found:
1. **Technical environment input**: a `technical-environment.md` (or equivalent) with a "Component Library" / design system entry (e.g., internal design system, Material UI, Shadcn, Tailwind theme).
2. **Explicit user-provided assets**: design tokens, a component library reference, brand guidelines, color/typography specs, CSS variables, or screenshots the user supplied in the conversation or workspace.
3. **Existing frontend (brownfield)**: an existing component library, theme, or CSS framework already in the codebase.

Record the outcome:
- **Design system provided** → extract its tokens (colors, typography, spacing, component styles) and the mockups MUST follow it.
- **No design system provided** → use a clean, neutral, accessible default and state this assumption explicitly in the completion message. Do NOT invent a branded design system.

Document the decision in `aidlc-docs/inception/mockups/design-system.md` (which source was used, and the key tokens/components applied).

## Step 3: Ask Clarifying Questions (if needed)
**See `common/question-format-guide.md` for question formatting rules**
- If the screen set, navigation, or design system is ambiguous, create a questions file using `[Answer]:` tags and wait for answers before generating.
- Only ask about UI-relevant decisions (screens needed, navigation, design system source, responsiveness/target devices). Do not re-ask requirements already settled.

---

# PART 2: GENERATION

## Step 4: Generate the Mockup SPA (MANDATORY)

Generate `aidlc-docs/inception/mockups/mockups.html` as an interactive SPA.

### SPA Requirements
- **Single-page application**: one HTML file with client-side navigation between screens (show/hide views or hash-based routing). No full-page reloads, no backend, no build step.
- **Self-contained**: all HTML, CSS, and JS inline. No external requests, no CDN links, no `fetch()`. It MUST open and work from a `file://` double-click in any modern browser.
- **Navigable**: a persistent navigation (menu, sidebar, or persona switcher) lets the reviewer move between all screens. Interactive controls (buttons, tabs, links) move between views; forms can use mock/placeholder data.
- **Persona-aware**: where stories differ by persona, let the reviewer switch persona and see the corresponding screens/flows.
- **Faithful to the design system**: apply the tokens and components recorded in Step 2. If none was provided, use the neutral default.
- **Mock data only**: populate screens with representative placeholder content; clearly non-production.
- **Automation-friendly**: add stable `data-testid` attributes to interactive elements using `{screen}-{element-role}` naming, consistent with `construction/code-generation.md`.
- **Traceable**: each screen references the story id(s) it represents (e.g., a small caption or `data-story` attribute), so mockups map back to `stories.md`.

### Scope Guidance
- Cover the primary screens and the main navigation paths from the stories. Prioritize breadth of key flows over exhaustive edge-case screens.
- Keep the mockup presentational — no real business logic, authentication, or persistence.

## Step 5: Update Progress
- [ ] Save `mockups.html` and `design-system.md` under `aidlc-docs/inception/mockups/`
- [ ] Update `aidlc-docs/aidlc-state.md` current status
- [ ] Mark the UI Mockups stage artifacts complete

## Step 6: Log Approval Prompt
- Before asking for approval, log the prompt with timestamp in `aidlc-docs/audit.md` (ISO 8601 format)

## Step 7: Present Completion Message

Present the completion message in this structure:

1. **Completion Announcement** (mandatory):

```markdown
# 🎨 UI Mockups Complete
```

2. **AI Summary** (optional): list the screens generated, personas covered, and which design system was applied (or state that a neutral default was used because none was provided). Keep factual, no workflow instructions.

3. **Formatted Workflow Message** (mandatory):

```markdown
> **📋 <u>**REVIEW REQUIRED:**</u>**  
> Open the interactive mockups in your browser (double-click): `aidlc-docs/inception/mockups/mockups.html`
> Navigate between screens and switch personas to review the proposed interface. Design system notes: `aidlc-docs/inception/mockups/design-system.md`



> **🚀 <u>**WHAT'S NEXT?**</u>**
>
> **You may:**
>
> 🔧 **Request Changes** - Ask for modifications to the screens, navigation, or styling based on your review  
> ✅ **Approve & Continue** - Approve the mockups and proceed to **[Next Stage]**

---
```

Replace `[Next Stage]` with the actual next stage name from the execution plan.

## Step 8: Wait for Explicit Approval
- Do not proceed until the user explicitly approves the mockups
- If the user requests changes, update `mockups.html` and repeat the approval process

## Step 9: Record Approval and Update Progress
- Log the user's approval response with timestamp in `aidlc-docs/audit.md`
- Mark UI Mockups stage complete in `aidlc-state.md` and set the next stage

---

# CRITICAL RULES

- **REVIEW ARTIFACT ONLY**: Mockups live in `aidlc-docs/` and are never application code. Never write mockup files to the workspace root.
- **SELF-CONTAINED SPA**: One file, inline assets, no network, opens from `file://`.
- **FOLLOW THE DESIGN SYSTEM WHEN PROVIDED**: If the user supplied a design system, the mockups must match it. Only fall back to a neutral default when none exists, and say so.
- **DERIVE FROM STORIES**: Screens and flows come from `stories.md`/`personas.md`; keep traceability to story ids.
- **EXPLICIT APPROVAL REQUIRED**: User must approve before proceeding to the next stage.

## Completion Criteria
- Design system decision recorded in `design-system.md`
- `mockups.html` generated as a self-contained, navigable SPA that opens from `file://`
- Screens cover the primary user flows and personas from the stories
- Design system applied when provided (neutral default otherwise, clearly stated)
- Mockups explicitly approved by the user
