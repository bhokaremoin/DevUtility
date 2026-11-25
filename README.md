# DevUtility

A lightweight macOS utility app that lives in your menu bar. Two separate tools, each one shortcut away: your clipboard history and your code snippets — without leaving your keyboard.

## Tools

| Tool | Menu-bar icon | Shortcut | Opens | Closes |
|---|---|---|---|---|
| **Clipboard** — browse and re-copy your last 15 copies | 📋 | `⌃⌥V` | at the mouse pointer | on any click outside it, `Esc`, its icon or shortcut |
| **Snippets** — save, search and copy reusable snippets | `</>` | `⌃⌥S` | centered, search ready to type into | its `✕`, its icon or shortcut (stays open while you work elsewhere) |

Both can be open at once; keys go to the one in front. Clipboard records copies from the moment DevUtility starts. Shortcuts can be changed per tool in Settings (`⌘,`, or right-click a menu-bar icon); giving one tool another tool's shortcut moves it.

## Install

Requires [Homebrew](https://brew.sh).

```bash
brew install --cask bhokaremoin/tap/devutility
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌃⌥V` / `⌃⌥S` | Open or close Clipboard / Snippets (from any app) |
| `↑` / `↓` | Move the selection |
| `↵` | Copy the selected item (outside a text field) |
| `⌘↵` | Copy the selected item's stored text |
| `⌘F` | Focus search (Snippets) |
| `Esc` | Clipboard: stop editing, then close. Snippets: clear the search, then stop editing (never closes) |
| `⌘,` | Open Settings |

Each tool's `?` button lists its own shortcuts.

## Requirements

- macOS 13 or later
- Apple Silicon or Intel Mac

## Build from Source

```bash
git clone https://github.com/bhokaremoin/DevUtility.git
cd DevUtility
npm install
cd macos && pod install && cd ..
VERSION=1.0.1 ./scripts/build-release.sh
```

## Development

See `CLAUDE.project.md` for setup and commands. Run the full test suite with:

```bash
npm run test:all
```
