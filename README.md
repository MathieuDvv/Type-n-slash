# Type'n'slash

A powerful browser extension that allows you to execute custom commands directly from any text input field in your browser. Compatible with all Chromium-based browsers (Chrome, Edge, Brave, Opera, etc.) and Orion browser.

## Features

- Execute commands from any text input field using customizable activation keys (default: /)
- Smart command suggestions with autocomplete
- Command history tracking with prioritized recent commands
- Support for command aliases (up to 2 aliases per command)
- Customizable commands for various actions:
  - Open websites in new tabs
  - Search using different search engines (Google, YouTube, DuckDuckGo, Bing, Brave)
  - Clear browser history and cache
  - Download pages (HTML/PDF)
  - Open developer tools
  - Execute JavaScript in the console
  - And more!
- Import/Export command configurations
- Dark mode support
- Configurable settings via GUI or JSON

## Installation

### Chrome Web Store
*(Coming soon)*

### Manual Installation (Developer Mode)

#### For Chrome:
1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

#### For Edge:
1. Clone this repository or download the source code
2. Open Edge and navigate to `edge://extensions/`
3. Enable "Developer mode" in the left sidebar
4. Click "Load unpacked" and select the extension directory

#### For Brave:
1. Clone this repository or download the source code
2. Open Brave and navigate to `brave://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

#### For Opera:
1. Clone this repository or download the source code
2. Open Opera and navigate to `opera://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the Type'n'slash icon in your browser toolbar to view available commands
2. Open the settings page to configure activation keys and commands
3. In any text input field:
   - Type `/` or `//` (or your custom activation key)
   - Start typing your command
   - Use arrow keys to navigate suggestions (prioritized by recent usage)
   - Press Enter to execute the command

Note: Some text inputs with custom implementations may have limited or no compatibility with the extension.

## Command Configuration

Commands are configured in JSON format. Each command has the following structure:

```json
{
    "commandName": {
        "action": "actionType",
        "args": ["argument1", "argument2"],
        "description": "Command description",
        "aliases": ["alias1", "alias2"]
    }
}
```

### Available Actions

- `openTab`: Open a URL in a new tab
- `search`: Search using a specified search engine (google, youtube, duckduckgo, bing, brave)
- `clearHistory`: Clear browsing history
- `clearCache`: Clear browser cache
- `downloadPage`: Download the current page (as HTML or PDF)
- `openDevTools`: Open Chrome Developer Tools
- `executeCommand`: Execute JavaScript in the console
- `reloadPage`: Reload the current page

### Example Configuration

```json
{
    "gh": {
        "action": "openTab",
        "args": ["https://github.com"],
        "description": "Open Github",
        "aliases": ["github", "git"]
    },
    "yt": {
        "action": "search",
        "args": ["youtube"],
        "description": "Search on YouTube",
        "aliases": ["youtube"]
    }
}
```

## Default Commands

The extension comes with several pre-configured commands:
- `gh`: Open GitHub
- `yt`: Search on YouTube
- `s`: Search on Google
- `ddg`: Search on DuckDuckGo
- `bing`: Search on Bing
- `brave`: Search on Brave
- `clear`: Clear browsing history
- `cache`: Clear browser cache
- `dev`: Open Developer Tools
- `dl`: Download current page as HTML
- `pdf`: Download current page as PDF
- `options`: Open Type'n'Slash options
- `vs`: Open VS Code online
- `gml`: Open Gmail

## Importing/Exporting Settings

1. Open the extension settings
2. Click "Export Settings" to download your current configuration
3. Click "Import Settings" to load a previously exported configuration

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 

## Attributions & Social

- Icons provided by [Lucide](https://lucide.dev/) ([ISC License](https://github.com/lucide-icons/lucide/blob/main/LICENSE))
- Code assistance by [Claude](https://anthropic.com/claude) from Anthropic
- Follow the developer [@dotSlimy](https://twitter.com/dotSlimy) on Twitter 