class TypeNSlash {
    constructor() {
        this.activationKey = '/';
        this.commands = new Map();
        this.suggestionBox = null;
        this.commandPill = null;
        this.currentInput = null;
        this.isActive = false;
        this.originalValue = '';
        this.currentCommand = null;
        this.originalHandlers = new Map();
        this.init();
    }

    async init() {
        // Load settings and commands
        await this.loadSettings();
        await this.loadCommands();
        
        // Initialize event listeners
        this.initializeListeners();
        
        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes) => {
            if (changes.commands) {
                this.commands = new Map(Object.entries(changes.commands.newValue || {}));
            }
            if (changes.settings) {
                this.activationKey = changes.settings.newValue?.activationKey || '/';
            }
        });
    }

    async loadSettings() {
        const { settings } = await chrome.storage.sync.get(['settings']);
        this.activationKey = settings?.activationKey || '/';
    }

    async loadCommands() {
        const { commands } = await chrome.storage.sync.get(['commands']);
        if (commands) {
            this.commands = new Map(Object.entries(commands));
        }
    }

    initializeListeners() {
        // Listen for input events on all text inputs and textareas
        document.addEventListener('input', this.handleInput.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    handleInput(event) {
        if (!this.isValidInput(event.target)) return;
        
        this.currentInput = event.target;
        const value = event.target.value;

        // If we have an active command pill, don't process activation keys
        if (this.commandPill) {
            return;
        }
        
        // Check if the input starts with an activation key
        if (value.endsWith(this.activationKey)) {
            this.isActive = true;
            this.showSuggestions(value);
            this.takeOverInput(event.target);
        } else if (this.isActive) {
            // Only check for activation key removal if we don't have a command pill
            if (!value.includes(this.activationKey)) {
                this.hideSuggestions();
                this.releaseInput();
                return;
            }
            this.updateSuggestions(value);
        }
    }

    handleKeyDown(event) {
        if (!this.isActive) {
            // Only handle activation key when not active
            if (event.key === this.activationKey) {
                if (this.isValidInput(event.target)) {
                    this.isActive = true;
                    this.currentInput = event.target;
                    this.showSuggestions('');
                    this.takeOverInput(event.target);
                }
            }
            return;
        }

        // Special handling for Enter key
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            
            if (this.commandPill) {
                // If we have a pill, execute with current input as parameters
                this.executeCommand(this.currentInput.value);
                return;
            }
            
            const value = this.currentInput.value;
            const commandText = value.slice(value.lastIndexOf(this.activationKey) + 1);
            const [commandName] = commandText.split(' ');
            
            // If we have a valid command, execute it immediately
            if (this.commands.has(commandName)) {
                this.executeCommand(value);
                return;
            }
            
            // Otherwise, try to use the selected suggestion
            if (this.suggestionBox) {
                const selected = this.suggestionBox.querySelector('.suggestion-item.selected');
                if (selected) {
                    const suggestedCommand = selected.dataset.command;
                    this.currentInput.value = this.activationKey + suggestedCommand;
                }
            }
            return;
        }

        // Special handling for Backspace when pill is shown
        if (event.key === 'Backspace' && this.commandPill) {
            event.preventDefault();
            
            // Always remove the entire command pill when backspace is pressed
            this.handlePillBackspace();
            return;
        }

        // For other keys, only prevent default if we need to
        if (this.shouldPreventDefault(event)) {
            event.preventDefault();
            event.stopPropagation();
        }

        switch (event.key) {
            case 'Escape':
                if (this.commandPill) {
                    this.handlePillBackspace();
                } else {
                    this.hideSuggestions();
                    this.releaseInput();
                }
                break;
            case ' ':
                // Handle space key for commands
                if (this.commandPill) return;

                const value = this.currentInput.value;
                const commandText = value.slice(value.lastIndexOf(this.activationKey) + 1);
                
                // If there's no command text (space right after activation key), escape the command mode
                if (!commandText.trim()) {
                    this.hideSuggestions();
                    this.releaseInput();
                    return;
                }

                const [commandName] = commandText.split(' ');
                
                if (this.commands.has(commandName)) {
                    event.preventDefault();
                    this.showCommandPill(commandName);
                    this.currentCommand = commandName;
                    this.currentInput.value = '';
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                if (this.suggestionBox && !this.commandPill) {
                    event.preventDefault();
                    this.navigateSuggestions(event.key === 'ArrowUp' ? -1 : 1);
                }
                break;
            case 'Tab':
                if (this.suggestionBox && !this.commandPill) {
                    event.preventDefault();
                    const selected = this.suggestionBox.querySelector('.suggestion-item.selected');
                    if (selected) {
                        const commandName = selected.dataset.command;
                        this.currentInput.value = this.activationKey + commandName;
                    }
                }
                break;
        }
    }

    shouldPreventDefault(event) {
        // Allow more keys when extension is active
        const allowedKeys = [
            'Backspace',
            'Delete',
            'ArrowLeft',
            'ArrowRight',
            'Tab',
            'Enter'
        ];

        // Allow all alphanumeric keys and common punctuation
        if (event.key.length === 1) {
            return false;
        }

        return !allowedKeys.includes(event.key);
    }

    takeOverInput(input) {
        if (this.originalHandlers.has(input)) return;

        const handlers = {
            keydown: input.onkeydown,
            keypress: input.onkeypress,
            keyup: input.onkeyup
        };

        this.originalHandlers.set(input, handlers);

        // Prevent form submission while active
        if (input.form) {
            const boundPreventSubmit = (e) => this.preventSubmit(e);
            handlers.preventSubmit = boundPreventSubmit;
            input.form.addEventListener('submit', boundPreventSubmit);
        }
    }

    preventSubmit(event) {
        if (this.isActive) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    releaseInput() {
        if (this.currentInput && this.originalHandlers.has(this.currentInput)) {
            const handlers = this.originalHandlers.get(this.currentInput);
            
            if (this.currentInput.form && handlers.preventSubmit) {
                this.currentInput.form.removeEventListener('submit', handlers.preventSubmit);
            }

            this.originalHandlers.delete(this.currentInput);
        }
        this.isActive = false;
        this.currentCommand = null;
    }

    handleClickOutside(event) {
        if (this.suggestionBox && !this.suggestionBox.contains(event.target)) {
            this.hideSuggestions();
        }
    }

    isValidInput(element) {
        // Check if element is null or undefined
        if (!element) return false;

        // Support for input elements with various types
        if (element.tagName === 'INPUT') {
            const validTypes = [
                'text',
                'search',
                'url',
                'email',
                'tel',
                'number',
                'password',
                '',
                undefined
            ];
            return validTypes.includes(element.type);
        }

        // Support for textarea elements
        if (element.tagName === 'TEXTAREA') return true;

        // Support for contenteditable elements
        if (element.contentEditable === 'true') return true;

        // Support for rich text editors and other editable elements
        if (element.role === 'textbox') return true;
        if (element.getAttribute('contenteditable') === 'true') return true;

        // Support for iframe-based editors (like Monaco, CodeMirror)
        if (element.tagName === 'IFRAME' && element.classList.contains('editor-frame')) return true;

        return false;
    }

    showSuggestions(value) {
        if (!this.suggestionBox) {
            this.suggestionBox = document.createElement('div');
            this.suggestionBox.className = 'type-n-slash-suggestions';
            document.body.appendChild(this.suggestionBox);
        }

        this.updateSuggestions(value);
        this.positionSuggestionBox();
    }

    async updateSuggestions(value) {
        if (!this.suggestionBox) return;

        const commandText = value.slice(value.lastIndexOf(this.activationKey) + 1);
        
        // Get command history
        const { commandHistory = [] } = await chrome.storage.sync.get(['commandHistory']);
        
        // Filter commands that match the input
        let matchingCommands = Array.from(this.commands.entries())
            .filter(([key]) => key.toLowerCase().startsWith(commandText.toLowerCase()));
        
        if (matchingCommands.length === 0) {
            this.suggestionBox.innerHTML = '<div class="suggestion-item no-results">No commands found</div>';
            return;
        }
        
        // Sort commands: first the recent ones from history, then alphabetically
        let sortedCommands = [];
        
        // First add matching commands from history
        if (commandHistory.length > 0) {
            // Get the last 5 used commands
            const recentCommands = [...new Set(commandHistory)].slice(0, 5);
            
            // Add matching commands from history first
            recentCommands.forEach(cmdName => {
                const command = this.commands.get(cmdName);
                if (command && cmdName.toLowerCase().startsWith(commandText.toLowerCase())) {
                    sortedCommands.push([cmdName, command]);
                    // Remove from matching commands to avoid duplicates
                    matchingCommands = matchingCommands.filter(([key]) => key !== cmdName);
                }
            });
        }
        
        // Then add remaining matching commands alphabetically
        matchingCommands.sort(([a], [b]) => a.localeCompare(b));
        sortedCommands = [...sortedCommands, ...matchingCommands];
        
        // Limit to 5 suggestions
        sortedCommands = sortedCommands.slice(0, 5);

        this.suggestionBox.innerHTML = sortedCommands
            .map(([name, command], index) => `
                <div class="suggestion-item${index === 0 ? ' selected' : ''}" data-command="${name}">
                    <span class="command-name">${name}</span>
                    <span class="command-description">${command.description || ''}</span>
                </div>
            `)
            .join('');
    }

    positionSuggestionBox() {
        if (!this.currentInput || !this.suggestionBox) return;

        const rect = this.currentInput.getBoundingClientRect();
        this.suggestionBox.style.position = 'fixed';
        this.suggestionBox.style.top = `${rect.bottom + window.scrollY}px`;
        this.suggestionBox.style.left = `${rect.left + window.scrollX}px`;
        this.suggestionBox.style.minWidth = `${rect.width}px`;
    }

    hideSuggestions() {
        if (this.suggestionBox) {
            this.suggestionBox.remove();
            this.suggestionBox = null;
        }
        this.removeCommandPill();
        this.releaseInput();
    }

    navigateSuggestions(direction) {
        const items = this.suggestionBox.querySelectorAll('.suggestion-item');
        const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
        
        items[currentIndex]?.classList.remove('selected');
        
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
        
        items[newIndex]?.classList.add('selected');
    }

    showCommandPill(commandName) {
        if (!this.currentInput) return;

        const pillWrapper = document.createElement('div');
        pillWrapper.className = 'command-pill-wrapper';

        const pill = document.createElement('div');
        pill.className = 'command-pill';
        pill.textContent = commandName;

        pillWrapper.appendChild(pill);

        // Position the pill wrapper
        const inputRect = this.currentInput.getBoundingClientRect();
        const inputStyle = window.getComputedStyle(this.currentInput);
        const inputPaddingLeft = parseInt(inputStyle.paddingLeft);

        pillWrapper.style.position = 'fixed';
        pillWrapper.style.top = `${inputRect.top + window.scrollY}px`;
        pillWrapper.style.left = `${inputRect.left + window.scrollX + inputPaddingLeft}px`;
        pillWrapper.style.height = `${inputRect.height}px`;

        document.body.appendChild(pillWrapper);
        this.commandPill = pillWrapper;

        // Adjust input padding to make space for the pill
        const pillWidth = pill.offsetWidth;
        this.currentInput.style.paddingLeft = `${pillWidth + inputPaddingLeft + 8}px`;
    }

    removeCommandPill() {
        if (this.commandPill) {
            if (this.currentInput) {
                this.currentInput.style.paddingLeft = '';
            }
            this.commandPill.remove();
            this.commandPill = null;
        }
    }

    // Handle backspace in command pill mode
    handlePillBackspace() {
        if (!this.commandPill || !this.currentInput) return;
        
        // Remove the pill and restore the command
        const commandName = this.currentCommand;
        
        // Hide suggestions and release input
        this.hideSuggestions();
        this.releaseInput();
        
        // Restore the command text
        if (this.currentInput) {
            this.currentInput.value = this.activationKey + commandName;
            
            // Position cursor at the end of the command
            const cursorPosition = this.activationKey.length + commandName.length;
            this.currentInput.setSelectionRange(cursorPosition, cursorPosition);
            this.currentInput.focus();
        }
    }

    async executeCommand(input) {
        let commandName, args;
        
        if (this.commandPill) {
            // If pill is shown, use stored command and current input as args
            commandName = this.currentCommand;
            args = input.trim() ? [input.trim()] : [];
        } else {
            // Normal command parsing
            const commandText = input.slice(input.lastIndexOf(this.activationKey) + 1);
            [commandName, ...args] = commandText.split(' ');
        }
        
        const command = this.commands.get(commandName);
        if (!command) return;

        try {
            // For search commands, combine all parameters into one search query
            if (command.action === 'search' && args.length > 0) {
                const searchEngine = command.args?.[0] || 'google';
                await chrome.runtime.sendMessage({
                    type: 'EXECUTE_COMMAND',
                    command: {
                        ...command,
                        args: [searchEngine, args.join(' ')]
                    }
                });
            } 
            // For executeCommand, if no preset command is provided, use the args as the command
            else if (command.action === 'executeCommand') {
                const jsCommand = command.args?.[0] || args.join(' ');
                if (jsCommand.trim()) {
                    await chrome.runtime.sendMessage({
                        type: 'EXECUTE_COMMAND',
                        command: {
                            ...command,
                            args: [jsCommand]
                        }
                    });
                }
            }
            else {
                await chrome.runtime.sendMessage({
                    type: 'EXECUTE_COMMAND',
                    command: {
                        ...command,
                        args: [...(command.args || []), ...args]
                    }
                });
            }

            // Update command history
            await this.updateCommandHistory(commandName);

            // Reset input and state
            this.hideSuggestions();
            if (this.currentInput) {
                this.currentInput.value = '';
            }
        } catch (error) {
            console.error('Failed to execute command:', error);
        }
    }

    // Update command history
    async updateCommandHistory(commandName) {
        try {
            // Get current history
            const { commandHistory = [] } = await chrome.storage.sync.get(['commandHistory']);
            
            // Add the command to the beginning of the history
            const newHistory = [commandName, ...commandHistory.filter(cmd => cmd !== commandName)];
            
            // Keep only the last 20 commands to avoid storage limits
            const trimmedHistory = newHistory.slice(0, 20);
            
            // Save updated history
            await chrome.storage.sync.set({ commandHistory: trimmedHistory });
        } catch (error) {
            console.error('Error updating command history:', error);
        }
    }
}

// Initialize the extension
const typeNSlash = new TypeNSlash();

// Add styles
const style = document.createElement('style');
style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    .type-n-slash-suggestions {
        position: fixed;
        background: #1A1A1A;
        border: 1px solid #333333;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 999999;
        max-height: 300px;
        overflow-y: auto;
        font-family: 'IBM Plex Mono', monospace;
        padding: 8px;
    }

    .suggestion-item {
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #fff;
        border-radius: 8px;
    }

    .suggestion-item:hover,
    .suggestion-item.selected {
        background: #2C2C2C;
        color: #9C6CE9;
    }

    .suggestion-item .command-name {
        font-weight: 500;
        margin-right: 12px;
        color: #FFFFFF;
    }

    .suggestion-item .command-description {
        color: #888888;
        font-size: 0.9em;
    }

    .suggestion-item.no-results {
        color: #888888;
        font-style: normal;
        justify-content: center;
        font-family: 'IBM Plex Mono', monospace;
    }

    .command-pill-wrapper {
        position: fixed;
        display: flex;
        align-items: center;
        pointer-events: none;
        z-index: 999998;
    }

    .command-pill {
        background: #000000;
        color: #FFFFFF;
        padding: 4px 12px;
        border-radius: 99px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
    }
`;
document.head.appendChild(style); 