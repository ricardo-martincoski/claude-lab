# CLAUDE.md

Claude Code plugin marketplace; each plugin in `plugins/<name>/` holds mods (function hooks),
skills, or both. Load the `plugin-authoring` skill before writing or debugging hooks, and the
`skill-creator` skill before writing or changing a skill.

## Rules

- Everything in English (code, comments, tests, docs, messages), in plain technical terms; use
  "context window usage", "5-hour session usage limit" and "7-day session usage limit", and say
  "Claude Code session" when "session" means the conversation.
- Wrap text and code at 100 columns, except JSON strings, test names, table rows and code blocks.
- Every plugin has a `README.md` (what it does, install, options if any, when it shows nothing),
  kept in sync with its behavior, `plugin.json` and its marketplace entry; plugins never mention
  each other.
- A new plugin also gets an entry in `.claude-plugin/marketplace.json` and a row and install line
  in the root `README.md`.
- Plugins cannot share files: keep the copies of `hooks/format.ts` and `hooks/format.test.ts`
  identical.
- After every code or test change, run `claude plugin validate`, `claude plugin test` and
  `tsc -p` on the plugin; `tsc` needs the plugin loaded once (hot reload or `--plugin-dir`).
- One behavior per test, named after it; check that each test fails when its behavior breaks.
- Build test dates from local date parts, so results do not depend on the time zone.
- Bump `version` only when changing a plugin already pushed; unpushed changes keep the version.
- Commit subjects of a plugin change start with its name (`show-usage: ...`, or
  `plugin: add <name>`); commit with `git commit -s` and a `Co-Authored-By: Claude` trailer.
- Read the GitHub remote over HTTPS (`git ls-remote https://...`), not through the SSH remote.
- Never `git add`, commit or push unless asked.
- Propose wording changes (docs, messages, commit messages) as small diffs before applying them.
