# warn-usage

Warns when context window usage or the 5-hour or 7-day session usage limit reaches a threshold,
with a message that stays on screen for a configurable time:

```
Context window usage reached 82%
5-hour session usage limit reached 82% [21:50]
7-day session usage limit reached 82% [Sat 2026-10-10 07:00]
```

- The 5-hour and 7-day session usage limits are the ones `/usage` shows as "Current session" and
  "Current week"; their reset times are in brackets, in local time, and left out when Claude Code
  does not report one.
- Each warning shows once when its value reaches the threshold, and again only after the value
  falls below it (for example after a compaction or a reset).
- Warnings raised at the same time are shown together, separated by `|`, for the longest of their
  durations.

Where a warning shows depends on the renderer (`/tui`). In the fullscreen renderer it is a box over
the top right corner of the transcript, under the plugin's name:

```
╭─────────────────────────────────────────╮
│ warn-usage                              │
│ Context window usage reached 41% |      │
│ 5-hour session usage limit reached 62%  │
│ [21:50]                                 │
╰─────────────────────────────────────────╯
```

In the default renderer it is one line on the right of the notification bar:

```
⏵⏵ auto mode on (shift+tab to cycle)  warn-usage: Context window usage reached 43% | 5-hour session usage limit reached 66% [21:50]
```

## Install

```
/plugin marketplace add ricardo-martincoski/claude-lab
/plugin install warn-usage@claude-lab
```

See the [claude-lab README](../../README.md) to install from a local clone or to develop the
plugin.

## Options

Set in the Claude Code config menu:

| Option | Default | What it sets |
| --- | --- | --- |
| `contextWarnAt` | 80% | Context window usage that raises a warning, from 1 to 100 |
| `sessionWarnAt` | 80% | 5-hour session usage limit that raises a warning, from 1 to 100 |
| `weekWarnAt` | 80% | 7-day session usage limit that raises a warning, from 1 to 100 |
| `contextToastSeconds` | 30 s | How long the context window usage warning stays on screen, from 4 to 60 seconds |
| `sessionToastSeconds` | 30 s | How long the 5-hour session usage limit warning stays on screen, from 4 to 60 seconds |
| `weekToastSeconds` | 30 s | How long the 7-day session usage limit warning stays on screen, from 4 to 60 seconds |

## When warnings are not shown

Values are checked only when a response arrives, so:

- No warning before the first response of a Claude Code session.
- No context window warning right after a compaction, until the next response.
- No 5-hour or 7-day session usage limit warning when not using a Claude subscription (for
  example with an API key).
