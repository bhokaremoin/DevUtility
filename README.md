# DevUtility

A lightweight macOS utility app that lives in your menu bar. Instant access to your clipboard history and code snippets — without leaving your keyboard.

## Features

- **Clipboard History** — Browse and re-copy recent clipboard entries
- **Snippet Manager** — Save, search, and copy reusable code snippets
- **Keyboard Shortcuts** — Navigate and copy entirely without a mouse
- **Global Shortcut** — Toggle the app from anywhere with a configurable hotkey (default: `Ctrl+Option+D`)
- **Menu Bar** — Stays out of your way until you need it

## Install

Requires [Homebrew](https://brew.sh).

```bash
brew install --cask bhokaremoin/tap/devutility
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Option+D` | Toggle app (global) |
| `↑` / `↓` | Navigate items |
| `⌘C` | Copy selected item |
| `⌘F` | Focus search (Snippets) |
| `Esc` | Deselect / close panel |

The global shortcut can be changed in the Settings tab.

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
