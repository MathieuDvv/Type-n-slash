// Default commands configuration
const DEFAULT_COMMANDS = {
    'yt': {
        action: 'search',
        args: ['youtube'],
        description: 'Search on YouTube'
    },
    'gh': {
        action: 'openTab',
        args: ['github.com/'],
        description: 'Open GitHub'
    },
    'gen': {
        action: 'openTab',
        args: ['genipedia.org/'],
        description: 'Open Genipedia'
    },
    'copy': {
        action: 'copy_url',
        args: [],
        description: 'Copy current URL'
    },
    's': {
        action: 'search',
        args: ['google'],
        description: 'Search on Google'
    },
    'dev': {
        action: 'openDevTools',
        args: [],
        description: 'Open Developer Tools'
    },
    'reload': {
        action: 'reloadPage',
        args: [],
        description: 'Reload the current page'
    },
    'exec': {
        action: 'executeCommand',
        args: [],
        description: 'Execute JavaScript in the console'
    }
};

// Available command types and their configurations
const COMMAND_TYPES = {
    'openTab': {
        type: 'url',
        placeholder: 'https://example.com',
        description: 'Open a URL in a new tab',
        displayName: 'Open Website'
    },
    'search': {
        type: 'select',
        options: ['google', 'youtube', 'duckduckgo', 'bing', 'brave'],
        description: 'Search using a search engine',
        displayName: 'Web Search'
    },
    'copy_url': {
        type: 'none',
        description: 'Copy current page URL',
        displayName: 'Copy URL'
    },
    'clearHistory': {
        type: 'none',
        description: 'Clear browsing history',
        displayName: 'Clear History'
    },
    'clearCache': {
        type: 'none',
        description: 'Clear browser cache',
        displayName: 'Clear Cache'
    },
    'downloadPage': {
        type: 'select',
        options: ['html', 'pdf'],
        description: 'Download current page',
        displayName: 'Download Page'
    },
    'openDevTools': {
        type: 'none',
        description: 'Open Developer Tools',
        displayName: 'Open DevTools'
    },
    'openOptions': {
        type: 'none',
        description: 'Open Type\'n\'Slash options',
        displayName: 'Open Settings'
    },
    'executeCommand': {
        type: 'text',
        placeholder: 'console.log("Hello World")',
        description: 'Execute JavaScript in the console',
        displayName: 'Run JavaScript'
    },
    'reloadPage': {
        type: 'none',
        description: 'Reload the current page',
        displayName: 'Refresh Page'
    }
};

class OptionsManager {
    constructor() {
        this.commands = new Map();
        this.isJsonEditorMode = false;
        
        // Setup event listeners
        document.getElementById('add-command').addEventListener('click', () => this.addCommand());
        document.getElementById('activation-key').addEventListener('input', (e) => {
            if (e.target.value.length > 0) {
                this.saveActivationKey(e.target.value[0]);
            }
        });
        document.getElementById('save').addEventListener('click', () => this.saveCommands());
        document.getElementById('export').addEventListener('click', () => this.exportSettings());
        document.getElementById('import').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', (e) => this.importSettings(e));
        document.getElementById('editor-toggle').addEventListener('click', () => this.toggleEditor());

        // Load initial state
        this.loadSettings();
    }

    async loadSettings() {
        const { commands, settings } = await chrome.storage.sync.get(['commands', 'settings']);
        
        // Set activation key
        const activationKey = settings?.activationKey || '/';
        const activationKeyInput = document.getElementById('activation-key');
        if (activationKeyInput) {
            activationKeyInput.value = activationKey;
        }
        
        // Load commands or set defaults if none exist
        if (!commands || Object.keys(commands).length === 0) {
            // Save default commands
            await chrome.storage.sync.set({ commands: DEFAULT_COMMANDS });
            this.commands = new Map(Object.entries(DEFAULT_COMMANDS));
        } else {
            this.commands = new Map(Object.entries(commands));
        }
        
        console.log('Loaded commands:', this.commands);
        
        // Ensure the command-list element exists
        const commandList = document.getElementById('command-list');
        if (!commandList) {
            console.error('Command list element not found');
            return;
        }
        
        // Clear existing commands
        commandList.innerHTML = '';
        
        // Render commands
        this.renderCommands();
        this.updateJsonEditor();
    }

    createCommandElement(name = '', command = { action: 'openTab', args: [''], description: '', aliases: [] }) {
        console.log('Creating command element for:', name, command);
        
        const div = document.createElement('div');
        div.className = 'command-item';
        
        // Command key
        const keyDiv = document.createElement('div');
        keyDiv.className = 'command-key';
        
        // Get the current activation key
        const activationKeyInput = document.getElementById('activation-key');
        const activationKey = activationKeyInput ? activationKeyInput.value : '/';
        keyDiv.textContent = activationKey;
        
        // Command name wrapper with add alias button
        const nameWrapper = document.createElement('div');
        nameWrapper.className = 'command-name-wrapper';
        
        // Command name input
        const nameInput = document.createElement('input');
        nameInput.value = name;
        nameInput.placeholder = 'Command name';
        nameInput.className = 'command-name';
        
        // Add alias button
        const addAliasButton = document.createElement('button');
        addAliasButton.className = 'add-alias-button';
        addAliasButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
        addAliasButton.title = 'Add alias';
        
        // Initialize aliases array if it doesn't exist
        if (!command.aliases) {
            command.aliases = [];
        }
        
        // Alias dropdown
        let aliasDropdown = null;
        
        // Function to toggle alias dropdown
        const toggleAliasDropdown = () => {
            if (aliasDropdown) {
                aliasDropdown.remove();
                aliasDropdown = null;
                return;
            }
            
            // Create alias dropdown
            aliasDropdown = document.createElement('div');
            aliasDropdown.className = 'alias-dropdown';
            
            // Dropdown title
            const title = document.createElement('div');
            title.className = 'alias-dropdown-title';
            title.textContent = 'Aliases';
            aliasDropdown.appendChild(title);
            
            // Alias list
            const aliasList = document.createElement('div');
            aliasList.className = 'alias-list';
            
            // Add existing aliases
            command.aliases.forEach((alias, index) => {
                const aliasItem = createAliasItem(alias, index);
                aliasList.appendChild(aliasItem);
            });
            
            aliasDropdown.appendChild(aliasList);
            
            // Add new alias button
            const addNewAliasBtn = document.createElement('button');
            addNewAliasBtn.className = 'add-new-alias';
            addNewAliasBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Add Alias';
            addNewAliasBtn.disabled = command.aliases.length >= 2;
            
            addNewAliasBtn.onclick = () => {
                if (command.aliases.length < 2) {
                    command.aliases.push('');
                    const aliasItem = createAliasItem('', command.aliases.length - 1);
                    aliasList.appendChild(aliasItem);
                    
                    // Focus the new input
                    const input = aliasItem.querySelector('input');
                    if (input) {
                        input.focus();
                    }
                    
                    // Disable button if we've reached the limit
                    if (command.aliases.length >= 2) {
                        addNewAliasBtn.disabled = true;
                    }
                }
            };
            
            aliasDropdown.appendChild(addNewAliasBtn);
            
            // Add dropdown to the document
            nameWrapper.appendChild(aliasDropdown);
            
            // Close dropdown when clicking outside
            const closeAliasDropdown = (e) => {
                if (!aliasDropdown.contains(e.target) && !addAliasButton.contains(e.target)) {
                    aliasDropdown.remove();
                    aliasDropdown = null;
                    document.removeEventListener('click', closeAliasDropdown);
                }
            };
            
            document.addEventListener('click', closeAliasDropdown);
        };
        
        // Function to create an alias item
        const createAliasItem = (alias, index) => {
            const item = document.createElement('div');
            item.className = 'alias-item';
            
            const input = document.createElement('input');
            input.className = 'alias-input';
            input.value = alias;
            input.placeholder = 'Alias name';
            
            input.onchange = () => {
                command.aliases[index] = input.value;
                this.saveCommands();
            };
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-alias';
            removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13L13 3M3 3L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
            
            removeBtn.onclick = () => {
                command.aliases.splice(index, 1);
                item.remove();
                
                // Re-enable the add button if we're below the limit
                const addNewAliasBtn = aliasDropdown.querySelector('.add-new-alias');
                if (addNewAliasBtn) {
                    addNewAliasBtn.disabled = command.aliases.length >= 2;
                }
                
                // Update indices for remaining aliases
                const aliasItems = aliasDropdown.querySelectorAll('.alias-item');
                aliasItems.forEach((item, i) => {
                    const input = item.querySelector('input');
                    const removeBtn = item.querySelector('.remove-alias');
                    
                    if (input) {
                        input.onchange = () => {
                            command.aliases[i] = input.value;
                            this.saveCommands();
                        };
                    }
                    
                    if (removeBtn) {
                        removeBtn.onclick = () => {
                            command.aliases.splice(i, 1);
                            item.remove();
                            
                            // Re-enable the add button if we're below the limit
                            const addNewAliasBtn = aliasDropdown.querySelector('.add-new-alias');
                            if (addNewAliasBtn) {
                                addNewAliasBtn.disabled = command.aliases.length >= 2;
                            }
                            
                            this.saveCommands();
                        };
                    }
                });
                
                this.saveCommands();
            };
            
            item.appendChild(input);
            item.appendChild(removeBtn);
            
            return item;
        };
        
        // Add alias button click handler
        addAliasButton.onclick = (e) => {
            e.stopPropagation();
            toggleAliasDropdown();
        };
        
        nameWrapper.appendChild(nameInput);
        nameWrapper.appendChild(addAliasButton);
        
        // Arrow icon
        const arrowDiv = document.createElement('div');
        arrowDiv.className = 'command-arrow';
        arrowDiv.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10H16M16 10L10 4M16 10L10 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        
        // Action button with dropdown
        const actionButton = document.createElement('button');
        actionButton.className = 'action-button';
        
        // Get the display name for the action
        const actionConfig = COMMAND_TYPES[command.action] || {};
        const actionDisplayName = actionConfig.displayName || command.action;
        
        actionButton.innerHTML = `
            <span>${actionDisplayName}</span>
            <span class="dropdown">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 5L6 8L9 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </span>
        `;
        
        // Action dropdown
        let actionDropdown = null;
        
        // Action dropdown functionality
        actionButton.onclick = (e) => {
            e.stopPropagation();
            
            // Toggle dropdown
            if (actionDropdown) {
                actionDropdown.remove();
                actionDropdown = null;
                return;
            }
            
            // Remove any existing dropdowns
            document.querySelectorAll('.action-dropdown, .select-dropdown').forEach(el => el.remove());
            
            // Create dropdown menu
            actionDropdown = document.createElement('div');
            actionDropdown.className = 'action-dropdown';
            actionDropdown.style.position = 'absolute';
            actionDropdown.style.top = '100%';
            actionDropdown.style.left = '0';
            actionDropdown.style.right = '0';
            actionDropdown.style.marginTop = '4px';
            
            // Add options to dropdown
            Object.entries(COMMAND_TYPES).forEach(([type, config]) => {
                const option = document.createElement('div');
                option.className = 'action-option';
                option.textContent = config.displayName || type;
                
                if (type === command.action) {
                    option.style.background = 'rgba(255, 255, 255, 0.1)';
                }
                
                option.onclick = () => {
                    // Update action button text
                    actionButton.innerHTML = `
                        <span>${config.displayName || type}</span>
                        <span class="dropdown">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M3 5L6 8L9 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                    `;
                    
                    // Replace value input
                    const newValue = this.createValueInput(type);
                    newValue.className = 'command-value action-value';
                    div.replaceChild(newValue, valueInput);
                    valueInput = newValue;
                    
                    // Update command
                    command.action = type;
                    this.saveCommands();
                    
                    // Remove dropdown
                    actionDropdown.remove();
                    actionDropdown = null;
                };
                
                actionDropdown.appendChild(option);
            });
            
            // Add dropdown to document
            actionButton.appendChild(actionDropdown);
            
            // Close dropdown when clicking outside
            const closeDropdown = (e) => {
                if (!actionDropdown.contains(e.target) && !actionButton.contains(e.target)) {
                    actionDropdown.remove();
                    actionDropdown = null;
                    document.removeEventListener('click', closeDropdown);
                }
            };
            
            document.addEventListener('click', closeDropdown);
        };

        // Value input based on type
        let valueInput = this.createValueInput(command.action, command.args?.[0] || '');
        valueInput.className = 'command-value action-value';
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13L13 3M3 3L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
        deleteBtn.className = 'delete-command';
        deleteBtn.onclick = () => {
            div.remove();
            this.saveCommands();
        };

        // Add elements to command item
        div.appendChild(keyDiv);
        div.appendChild(nameWrapper);
        div.appendChild(arrowDiv);
        div.appendChild(actionButton);
        div.appendChild(valueInput);
        div.appendChild(deleteBtn);

        // Add change listeners
        nameInput.onchange = () => this.saveCommands();
        
        // Update activation key when it changes
        document.getElementById('activation-key').addEventListener('input', (e) => {
            keyDiv.textContent = e.target.value || '/';
        });

        console.log('Command element created:', div);
        return div;
    }

    createValueInput(type, value = '') {
        console.log('Creating value input for type:', type, 'with value:', value);
        
        const config = COMMAND_TYPES[type];
        if (!config) {
            console.error('Unknown command type:', type);
            // Create a default input for unknown types
            const defaultInput = document.createElement('input');
            defaultInput.type = 'text';
            defaultInput.className = 'command-value action-value';
            defaultInput.value = value || '';
            defaultInput.placeholder = 'Value';
            defaultInput.onchange = () => this.saveCommands();
            return defaultInput;
        }
        
        let input;

        if (config.type === 'select') {
            // For select types, create a custom dropdown that looks like the action button
            const wrapper = document.createElement('div');
            wrapper.className = 'select-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.width = '100%';
            
            const selectButton = document.createElement('button');
            selectButton.className = 'action-value';
            selectButton.style.display = 'flex';
            selectButton.style.justifyContent = 'space-between';
            selectButton.style.alignItems = 'center';
            selectButton.style.width = '100%';
            selectButton.style.textAlign = 'left';
            selectButton.style.cursor = 'pointer';
            
            // Find the selected option or use the first one
            const selectedOption = value || config.options[0];
            
            selectButton.innerHTML = `
                <span>${selectedOption}</span>
                <span class="dropdown">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 5L6 8L9 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
            `;
            
            // Dropdown reference
            let selectDropdown = null;
            
            selectButton.onclick = (e) => {
                e.stopPropagation();
                
                // Toggle dropdown
                if (selectDropdown) {
                    selectDropdown.remove();
                    selectDropdown = null;
                    return;
                }
                
                // Remove any existing dropdowns
                document.querySelectorAll('.action-dropdown, .select-dropdown').forEach(el => el.remove());
                
                // Create dropdown menu
                selectDropdown = document.createElement('div');
                selectDropdown.className = 'select-dropdown';
                selectDropdown.style.position = 'absolute';
                selectDropdown.style.top = '100%';
                selectDropdown.style.left = '0';
                selectDropdown.style.right = '0';
                selectDropdown.style.marginTop = '4px';
                
                // Add options to dropdown
            config.options.forEach(option => {
                    const optionElement = document.createElement('div');
                    optionElement.className = 'select-option';
                    optionElement.textContent = option;
                    
                    if (option === selectedOption) {
                        optionElement.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                    
                    optionElement.onclick = () => {
                        // Update button text
                        selectButton.innerHTML = `
                            <span>${option}</span>
                            <span class="dropdown">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M3 5L6 8L9 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                        `;
                        
                        // Update selected value
                        wrapper.dataset.value = option;
                        
                        // Save commands
                        this.saveCommands();
                        
                        // Remove dropdown
                        selectDropdown.remove();
                        selectDropdown = null;
                    };
                    
                    selectDropdown.appendChild(optionElement);
                });
                
                // Add dropdown to document
                wrapper.appendChild(selectDropdown);
                
                // Close dropdown when clicking outside
                const closeDropdown = (e) => {
                    if (!selectDropdown.contains(e.target) && !selectButton.contains(e.target)) {
                        selectDropdown.remove();
                        selectDropdown = null;
                        document.removeEventListener('click', closeDropdown);
                    }
                };
                
                document.addEventListener('click', closeDropdown);
            };
            
            wrapper.appendChild(selectButton);
            wrapper.dataset.value = selectedOption;
            
            // Add a method to get the value
            wrapper.getValue = () => wrapper.dataset.value;
            
            input = wrapper;
        } else if (config.type === 'url' || config.type === 'text') {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'action-value';
            input.placeholder = config.placeholder;
            input.value = value || '';
            
            // Add a method to get the value
            input.getValue = () => input.value;
        } else {
            input = document.createElement('span');
            input.className = 'action-value no-input';
            input.textContent = 'No parameters needed';
            input.style.opacity = '0.5';
            input.style.fontStyle = 'italic';
            
            // Add a method to get the value
            input.getValue = () => '';
        }

        input.onchange = () => this.saveCommands();
        console.log('Value input created:', input);
        return input;
    }

    addCommand() {
        console.log('Adding new command');
        const commandList = document.getElementById('command-list');
        if (!commandList) {
            console.error('Command list element not found in addCommand');
            return;
        }
        
        // Create a new command element with default values
        const element = this.createCommandElement('', { 
            action: 'openTab', 
            args: [''], 
            description: COMMAND_TYPES['openTab'].description 
        });
        
        // Add it to the command list
        commandList.appendChild(element);
        
        // Focus on the name input to make it easier for the user to start typing
        const nameInput = element.querySelector('.command-name');
        if (nameInput) {
            nameInput.focus();
        }
        
        console.log('New command added');
        
        // Don't save immediately - let the user configure the command first
        // this.saveCommands();
    }

    async saveActivationKey(key) {
        try {
            await chrome.storage.sync.set({
                settings: { activationKey: key || '/' }
            });
            this.showStatus('Activation key saved!', 'success');
        } catch (error) {
            this.showStatus('Error saving activation key', 'error');
        }
    }

    async saveCommands() {
        try {
            const commands = {};
            
            if (this.isJsonEditorMode) {
                try {
                    const jsonEditor = document.getElementById('json-editor');
                    const parsed = JSON.parse(jsonEditor.value);
                    Object.assign(commands, parsed);
                    console.log('Commands parsed from JSON editor:', commands);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    this.showStatus('Invalid JSON format', 'error');
                    return;
                }
            } else {
                const commandItems = document.querySelectorAll('.command-item');
                console.log('Found command items:', commandItems.length);
                
                // First pass: collect all main commands
                commandItems.forEach((item, index) => {
                    const nameInput = item.querySelector('.command-name');
                    if (!nameInput) {
                        console.error('Command name input not found for item', index);
                        return;
                    }
                    
                    const name = nameInput.value.trim();
                    if (!name) {
                        console.log('Empty command name for item', index);
                        return;
                    }

                    // Get action from the action button
                    const actionButton = item.querySelector('.action-button');
                    if (!actionButton) {
                        console.error('Action button not found for item', index);
                        return;
                    }
                    
                    // Find the action type by comparing display names
                    let actionType = '';
                    Object.entries(COMMAND_TYPES).forEach(([type, config]) => {
                        const displayName = config.displayName || type;
                        const buttonText = actionButton.querySelector('span')?.textContent;
                        if (displayName === buttonText) {
                            actionType = type;
                        }
                    });
                    
                    if (!actionType) {
                        console.error('Could not determine action type for item', index);
                        return;
                    }
                    
                    // Get value from the value input
                    const valueElement = item.querySelector('.action-value');
                    if (!valueElement) {
                        console.error('Value element not found for item', index);
                        return;
                    }
                    
                    // Use the getValue method if available, otherwise try to get the value directly
                    let value = '';
                    if (typeof valueElement.getValue === 'function') {
                        value = valueElement.getValue();
                    } else if (valueElement.tagName.toLowerCase() === 'input') {
                        value = valueElement.value;
                    } else if (valueElement.tagName.toLowerCase() === 'select') {
                        value = valueElement.value;
                    } else if (valueElement.tagName.toLowerCase() === 'div' && valueElement.dataset.value) {
                        value = valueElement.dataset.value;
                    }

                    // Find aliases in the dropdown if it exists
                    const aliases = [];
                    const aliasDropdown = item.querySelector('.alias-dropdown');
                    if (aliasDropdown) {
                        const aliasInputs = aliasDropdown.querySelectorAll('.alias-input');
                        aliasInputs.forEach(input => {
                            const alias = input.value.trim();
                            if (alias) {
                                aliases.push(alias);
                            }
                        });
                    }

                    // Create the command object
                    commands[name] = {
                        action: actionType,
                        args: value ? [value] : [],
                        description: this.generateDescription(actionType, value),
                        aliases: aliases
                    };
                    
                    console.log('Added command:', name, commands[name]);
                });
                
                // Second pass: add aliases as separate commands
                Object.entries(commands).forEach(([name, command]) => {
                    if (command.aliases && command.aliases.length > 0) {
                        command.aliases.forEach(alias => {
                            if (alias && !commands[alias]) {
                                commands[alias] = {
                                    action: command.action,
                                    args: command.args,
                                    description: `Alias for ${name}`,
                                    isAlias: true,
                                    mainCommand: name
                                };
                            }
                        });
                    }
                });
            }

            console.log('Saving commands:', commands);

            // Save to storage
            await chrome.storage.sync.set({ commands });
            this.commands = new Map(Object.entries(commands));
            console.log('Commands saved, new size:', this.commands.size);
            
            // Update UI
            if (!this.isJsonEditorMode) {
                this.updateJsonEditor();
                this.renderCommands(); // Re-render commands after saving
            }
            this.showStatus('Commands saved!', 'success');
        } catch (error) {
            console.error('Error saving commands:', error);
            this.showStatus('Error saving commands', 'error');
        }
    }

    generateDescription(type, value) {
        const config = COMMAND_TYPES[type];
        if (!config) {
            return `Execute ${type} command`;
        }
        
        // Return the description from the command type configuration
        return config.description;
    }

    toggleEditor() {
        this.isJsonEditorMode = !this.isJsonEditorMode;
        const commandList = document.getElementById('command-list');
        const jsonEditor = document.getElementById('json-editor');
        const toggleButton = document.getElementById('editor-toggle');

        if (this.isJsonEditorMode) {
            commandList.style.display = 'none';
            jsonEditor.classList.remove('hidden');
            this.updateJsonEditor();
        } else {
            try {
                const commands = JSON.parse(jsonEditor.value);
                this.commands = new Map(Object.entries(commands));
                this.renderCommands();
                jsonEditor.classList.add('hidden');
                commandList.style.display = '';
            } catch (error) {
                this.showStatus('Invalid JSON format', 'error');
                return;
            }
        }
    }

    updateJsonEditor() {
        const jsonEditor = document.getElementById('json-editor');
        const commands = Object.fromEntries(this.commands);
        jsonEditor.value = JSON.stringify(commands, null, 2);
    }

    renderCommands() {
        const commandList = document.getElementById('command-list');
        if (!commandList) {
            console.error('Command list element not found in renderCommands');
            return;
        }
        
        console.log('Rendering commands, count:', this.commands.size);
        commandList.innerHTML = '';
        
        if (this.commands.size === 0) {
            console.log('No commands to render');
            const noCommandsDiv = document.createElement('div');
            noCommandsDiv.className = 'no-commands';
            noCommandsDiv.textContent = 'No commands configured yet. Click the + button to add a command.';
            commandList.appendChild(noCommandsDiv);
            return;
        }
        
        this.commands.forEach((command, name) => {
            console.log('Creating element for command:', name, command);
            const element = this.createCommandElement(name, command);
            commandList.appendChild(element);
        });
        
        console.log('Commands rendered, command list now contains:', commandList.children.length, 'elements');
    }

    exportSettings() {
        try {
            const settings = {
                activationKey: document.getElementById('activation-key').value,
                commands: Object.fromEntries(this.commands)
            };
            
            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'type-n-slash-settings.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showStatus('Settings exported!', 'success');
        } catch (error) {
            this.showStatus('Error exporting settings', 'error');
        }
    }

    async importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const settings = JSON.parse(text);
            
            if (settings.activationKey) {
                document.getElementById('activation-key').value = settings.activationKey;
                await this.saveActivationKey(settings.activationKey);
            }
            
            if (settings.commands) {
                this.commands = new Map(Object.entries(settings.commands));
                this.renderCommands();
                await this.saveCommands();
            }
            
            this.showStatus('Settings imported!', 'success');
        } catch (error) {
            this.showStatus('Error importing settings', 'error');
        }
        
        event.target.value = '';
    }

    showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.optionsManager = new OptionsManager();
}); 