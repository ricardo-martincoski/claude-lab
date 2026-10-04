# claude-lab

Experimental Claude Code plugins (mods, skills and more), installable as a plugin marketplace.

## Plugins

| Plugin | What it does |
| --- | --- |
| [show-usage](plugins/show-usage) | Shows context usage and usage limits in the status line; warns at 80% context usage |

## Install

```
/plugin marketplace add ricardo-martincoski/claude-lab
/plugin install show-usage@claude-lab
```

### From a local clone

Add the clone itself as a marketplace; plugins are then loaded directly from that directory, so
changes take effect after `/reload-plugins`:

```
git clone https://github.com/ricardo-martincoski/claude-lab.git ~/claude-lab
/plugin marketplace add ~/claude-lab
/plugin install show-usage@claude-lab
```

## Develop

Load a plugin for a single session, without installing it:

```
claude --plugin-dir plugins/show-usage
```

Validate and test it:

```
claude plugin validate plugins/show-usage
claude plugin test plugins/show-usage
```

Type-check it (TypeScript 5.4 or newer):

```
tsc -p plugins/show-usage
```

The plugin's `tsconfig.json` extends type declarations that Claude Code generates in
`.claude-plugin/types/` when it loads the plugin with `--plugin-dir`, so in a fresh clone load the
plugin once before running `tsc`.

## License

[MIT](LICENSE)
