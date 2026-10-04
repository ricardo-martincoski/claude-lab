# show-usage

Shows context window usage and the 5-hour and 7-day session usage limits on one status line,
updated after every response:

```
⚠ show-usage: context 28% | session 30% [21:50] | week 5% [Sat 2026-10-10 07:00]
```

- `context`: how full the context window is.
- `session` and `week`: the 5-hour and 7-day session usage limits, which `/usage` shows as
  "Current session" and "Current week", with their reset times in brackets, in local time.

Claude Code adds the `⚠ show-usage:` prefix to mark the line as coming from a plugin.

## Install

```
/plugin marketplace add ricardo-martincoski/claude-lab
/plugin install show-usage@claude-lab
```

See the [claude-lab README](../../README.md) to install from a local clone or to develop the
plugin.

## When values are not shown

The line shows only what Claude Code has reported so far:

- Nothing at all before the first response of a Claude Code session.
- No `context` part right after a compaction, until the next response.
- No `session` and `week` parts when not using a Claude subscription (for example with an API
  key).
- No reset time when Claude Code does not report one.

The line changes only when a response arrives, so while the Claude Code session is idle it keeps
the last values, even after a usage limit resets.
