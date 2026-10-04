# claude-lab

Experimental Claude Code plugins (mods, skills and more), installable as a plugin marketplace.

## Plugins

| Plugin | What it does |
| --- | --- |
| [context-usage](plugins/context-usage) | Shows context window usage in the status line and warns when it reaches 80% |

## Install

```
/plugin marketplace add ricardo-martincoski/claude-lab
/plugin install context-usage@claude-lab
```

### From a local clone

Add the clone itself as a marketplace; plugins are then loaded directly from that directory, so
changes take effect after `/reload-plugins`:

```
git clone https://github.com/ricardo-martincoski/claude-lab.git ~/claude-lab
/plugin marketplace add ~/claude-lab
/plugin install context-usage@claude-lab
```

## Develop

Load a plugin for a single session, without installing it:

```
claude --plugin-dir plugins/context-usage
```

Validate and test it:

```
claude plugin validate plugins/context-usage
claude plugin test plugins/context-usage
```

Type-check it (TypeScript 5.4 or newer):

```
tsc -p plugins/context-usage
```

The plugin's `tsconfig.json` extends type declarations that Claude Code generates in
`.claude-plugin/types/` when it loads the plugin with `--plugin-dir`, so in a fresh clone load the
plugin once before running `tsc`.

## License

[MIT](LICENSE)
