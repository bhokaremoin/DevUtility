# Writing for the developer to review

There are two kinds of documents. Write each one for its reader.

## 1. Repo documents: as detailed as useful

Specs, plans, brainstorming notes and implementation details live in `docs/` and are committed.
They are context for agents and for whoever works on the code later, so they can be long and
complete: file lists, interfaces, exact values, step-by-step tasks, edge cases, evidence.

## 2. Review overviews: a 3-minute read

Anything the developer is asked to review, discuss or approve is a short overview built from
the repo document. Examples: a spec or plan before work starts, a design, a report, the summary
of a PR. It is published as a claude.ai Artifact (or Claude Doc), opened, and linked in the reply.
It is never the repo document itself.

The developer reads it in about 3 minutes, approves it or asks about the parts they care about.
They ask for details when they want them, so leave the details out.

**Keep:**
- **What changes for the user of the app:** features, behavior, and what they will notice.
- **The architecture,** drawn: the main parts and how they talk to each other.
- **The key decisions,** each with a one-line "why". Choices the spec left open go here, so they can be overridden.
- **The logic or flow that matters:** when X happens, Y happens.
- **Open questions,** and anything that needs the developer's call.

**Show it, don't narrate it:**
- Diagrams: architecture boxes, flowcharts, sequence diagrams, state diagrams. Use Mermaid where
  the medium renders it, else the medium's own diagram tool.
- Tables for comparisons and rules (who, when, what happens).
- At most a few short code blocks, only where code is the clearest way to show an interface or a rule.

**Leave out:**
- File lists, function signatures, test names, commands, commit messages, task steps.
- Anything a user of the app would not care about when judging the change.
- Restating the request, methodology, background the developer already knows, "key takeaways".

**Shape:**
- A one-paragraph summary first: what it does and why.
- Then a few short sections, each led by a diagram or table.
- End with "Decisions to confirm" or "Open questions" if there are any.
- Link the full repo document at the end for anyone who wants the detail.
