# Type'n'slash

A powerful browser extension that allows you to execute custom commands directly from any text input field in your browser. Compatible with all Chromium-based browsers (Chrome, Edge, Brave, Opera, etc.) and Orion browser.

## Features

- Execute commands from any text input field using customizable activation keys (default: /)
- Smart command suggestions with autocomplete
- Command history tracking with prioritized recent commands
- Support for command aliases (up to 2 aliases per command)
- **Poly commands** to execute multiple actions with a single command
- **Parameter support** for commands with a simple space-based syntax
- Customizable commands for various actions:
  - Open websites in new tabs
  - Search using different search engines (Google, YouTube, DuckDuckGo, Bing, Brave, Wikipedia)
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

### Using Command Parameters

Type'n'slash supports parameters for commands, allowing you to pass additional information to your commands:

1. Type your command (e.g., `/yt`)
2. Press **Space** to activate the command pill
3. Type your parameter (e.g., `cute cats`)
4. Press Enter to execute the command with the parameter

The command pill appears when you press space after a valid command, indicating that the command is ready to receive parameters.

Example:
- `/yt cute cats` - Searches YouTube for "cute cats"
- `/s javascript tutorial` - Searches Google for "javascript tutorial"
- `/wiki quantum physics` - Searches Wikipedia for "quantum physics"

### Poly Commands

Poly commands allow you to execute multiple commands with a single shortcut. For example, you can create a research command that searches both YouTube and Wikipedia with one command.

To use parameters with poly commands:
1. Type your poly command (e.g., `/research`)
2. Press **Space** to activate the command pill
3. Type your parameter (e.g., `quantum computing`)
4. Press Enter to execute all commands in the sequence with your parameter

Example:
- `/research quantum computing` - Could search YouTube, Google, and Wikipedia for "quantum computing" in one go

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
- `search`: Search using a specified search engine (google, youtube, duckduckgo, bing, brave, wikipedia)
- `clearHistory`: Clear browsing history
- `clearCache`: Clear browser cache
- `downloadPage`: Download the current page (as HTML or PDF)
- `openDevTools`: Open Chrome Developer Tools
- `executeCommand`: Execute JavaScript in the console
- `reloadPage`: Reload the current page
- `poly`: Execute multiple commands in sequence

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
    },
    "research": {
        "action": "poly",
        "args": ["[{\"action\":\"search\",\"args\":[\"google\"]},{\"action\":\"search\",\"args\":[\"wikipedia\"]}]"],
        "description": "Search on Google and Wikipedia",
        "aliases": ["study"]
    }
}
```

## Creating Poly Commands

To create a poly command:

1. Open the extension settings
2. Click "Add Command"
3. Enter a name for your command (e.g., "research")
4. Select "Poly Command" from the action dropdown
5. Click "Configure Commands" to open the poly command editor
6. Click "Add Command" to add actions to your sequence
7. Configure each action in the sequence (e.g., search on different engines)
8. Click outside the modal to save your configuration

When you execute a poly command with a parameter, the parameter will be applied to all search commands in the sequence.

## Default Commands

The extension comes with several pre-configured commands:
- `gh`: Open GitHub
- `yt`: Search on YouTube
- `s`: Search on Google
- `ddg`: Search on DuckDuckGo
- `bing`: Search on Bing
- `brave`: Search on Brave
- `wiki`: Search on Wikipedia
- `clear`: Clear browsing history
- `cache`: Clear browser cache
- `dev`: Open Developer Tools
- `dl`: Download current page as HTML
- `pdf`: Download current page as PDF
- `options`: Open Type'n'Slash options
- `vs`: Open VS Code online
- `gml`: Open Gmail
- `multi`: Example poly command that opens GitHub and searches Google

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