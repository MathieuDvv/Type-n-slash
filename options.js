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
    'wiki': {
        action: 'search',
        args: ['wikipedia'],
        description: 'Search on Wikipedia'
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
    'multi': {
        action: 'poly',
        args: ['[{"action":"openTab","args":["github.com/"]},{"action":"search","args":["google"]}]'],
        description: 'Open GitHub and search Google'
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
        options: ['google', 'youtube', 'duckduckgo', 'bing', 'brave', 'wikipedia'],
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
    },
    'poly': {
        type: 'poly',
        description: 'Execute multiple commands in sequence',
        displayName: 'Poly Command'
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
            actionDropdown.style.position = 'fixed';
            actionDropdown.style.zIndex = '10000';
            
            // Calculate position based on button's position
            const buttonRect = actionButton.getBoundingClientRect();
            actionDropdown.style.top = `${buttonRect.bottom + 4}px`;
            actionDropdown.style.left = `${buttonRect.left}px`;
            actionDropdown.style.width = `${buttonRect.width}px`;
            
            actionDropdown.style.backgroundColor = '#9C6CE9';
            actionDropdown.style.border = '1px solid #8A5CD8';
            actionDropdown.style.borderRadius = '4px';
            actionDropdown.style.maxHeight = '300px';
            actionDropdown.style.overflowY = 'auto';
            actionDropdown.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            
            // Add options to dropdown
            Object.entries(COMMAND_TYPES).forEach(([type, config]) => {
                const option = document.createElement('div');
                option.className = 'action-option';
                option.textContent = config.displayName || type;
                option.style.padding = '8px 12px';
                option.style.cursor = 'pointer';
                option.style.color = 'white';
                
                if (type === command.action) {
                    option.style.backgroundColor = '#8A5CD8';
                }
                
                option.onmouseover = () => {
                    option.style.backgroundColor = '#8A5CD8';
                };
                
                option.onmouseout = () => {
                    if (action !== command.action) {
                        option.style.backgroundColor = '';
                    }
                };
                
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
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Delete Command';
        deleteBtn.style.backgroundColor = 'transparent';
        deleteBtn.style.color = '#888';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '4px';
        deleteBtn.style.fontSize = '20px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.padding = '0 8px';
        deleteBtn.style.paddingLeft = '20px';
        deleteBtn.style.marginRight = '-10px';
        deleteBtn.style.lineHeight = '1';
        deleteBtn.style.transition = 'color 0.2s ease';
        
        deleteBtn.onmouseover = () => {
            deleteBtn.style.color = '#d9534f';
        };
        
        deleteBtn.onmouseout = () => {
            deleteBtn.style.color = '#888';
        };
        
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

        if (config.type === 'poly') {
            // For poly command type, create a button that opens a modal
            const wrapper = document.createElement('div');
            wrapper.className = 'poly-wrapper';
            wrapper.style.width = '100%';
            
            const polyButton = document.createElement('button');
            polyButton.className = 'action-value poly-button';
            polyButton.textContent = 'Configure Commands';
            polyButton.style.cursor = 'pointer';
            
            // Parse existing commands or initialize empty array
            let polyCommands = [];
            try {
                if (value && typeof value === 'string') {
                    polyCommands = JSON.parse(value);
                }
            } catch (e) {
                console.error('Error parsing poly commands:', e);
                polyCommands = [];
            }
            
            if (!Array.isArray(polyCommands)) {
                polyCommands = [];
            }
            
            // Store commands in the wrapper's dataset
            wrapper.dataset.value = JSON.stringify(polyCommands);
            
            polyButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Create modal overlay
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.right = '0';
                overlay.style.bottom = '0';
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                overlay.style.display = 'flex';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';
                overlay.style.zIndex = '9999';
                
                // Create modal
                const modal = document.createElement('div');
                modal.className = 'poly-modal';
                modal.style.backgroundColor = '#2a2a2a';
                modal.style.borderRadius = '8px';
                modal.style.padding = '20px';
                modal.style.width = '600px';
                modal.style.maxWidth = '90%';
                modal.style.maxHeight = '80vh';
                modal.style.overflowY = 'auto';
                modal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                
                // Modal header
                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                header.style.marginBottom = '20px';
                
                const title = document.createElement('div');
                title.textContent = '// configure';
                title.style.margin = '0';
                title.style.fontSize = '16px';
                title.style.fontWeight = '500';
                title.style.color = 'white';
                title.style.fontFamily = 'monospace';
                
                const closeButton = document.createElement('button');
                closeButton.innerHTML = '&times;';
                closeButton.style.background = 'none';
                closeButton.style.border = 'none';
                closeButton.style.fontSize = '24px';
                closeButton.style.cursor = 'pointer';
                closeButton.style.color = '#fff';
                
                closeButton.onclick = () => {
                    // Save before closing
                    savePolyConfiguration();
                    document.body.removeChild(overlay);
                };
                
                // Function to save the poly configuration
                const savePolyConfiguration = () => {
                    wrapper.dataset.value = JSON.stringify(polyCommands);
                    
                    // Update the button text to show number of commands
                    polyButton.textContent = polyCommands.length > 0 
                        ? `${polyCommands.length} Command${polyCommands.length !== 1 ? 's' : ''} Configured`
                        : 'Configure Commands';
                    
                    // Save commands
                    this.saveCommands();
                };
                
                header.appendChild(title);
                header.appendChild(closeButton);
                
                // Command list container
                const commandListContainer = document.createElement('div');
                commandListContainer.className = 'poly-command-list';
                commandListContainer.style.marginBottom = '20px';
                
                // Function to render the command list
                const renderCommandList = () => {
                    commandListContainer.innerHTML = '';
                    
                    if (polyCommands.length === 0) {
                        const emptyState = document.createElement('div');
                        emptyState.style.textAlign = 'center';
                        emptyState.style.padding = '20px';
                        emptyState.style.color = '#888';
                        emptyState.textContent = 'No commands added yet. Click "Add Command" below to get started.';
                        commandListContainer.appendChild(emptyState);
                        return;
                    }
                    
                    // Create sortable list
                    const sortableList = document.createElement('div');
                    sortableList.className = 'sortable-list';
                    sortableList.style.display = 'flex';
                    sortableList.style.flexDirection = 'column';
                    sortableList.style.gap = '8px';
                    
                    polyCommands.forEach((cmd, index) => {
                        // Create command item similar to the command creation in options
                        const cmdItem = document.createElement('div');
                        cmdItem.className = 'poly-command-item';
                        cmdItem.style.display = 'flex';
                        cmdItem.style.alignItems = 'center';
                        cmdItem.style.gap = '8px';
                        cmdItem.style.padding = '10px';
                        cmdItem.style.backgroundColor = '#3a3a3a';
                        cmdItem.style.borderRadius = '4px';
                        cmdItem.style.cursor = 'grab';
                        cmdItem.style.width = '100%';
                        cmdItem.style.boxSizing = 'border-box';
                        cmdItem.draggable = true;
                        cmdItem.dataset.index = index;
                        
                        // Handle drag events
                        cmdItem.addEventListener('dragstart', (e) => {
                            e.dataTransfer.setData('text/plain', index);
                            cmdItem.style.opacity = '0.5';
                            setTimeout(() => {
                                cmdItem.classList.add('dragging');
                            }, 0);
                        });
                        
                        cmdItem.addEventListener('dragend', () => {
                            cmdItem.style.opacity = '1';
                            cmdItem.classList.remove('dragging');
                            
                            // Save after drag operation
                            wrapper.dataset.value = JSON.stringify(polyCommands);
                            this.saveCommands();
                        });
                        
                        // Drag handle
                        const dragHandle = document.createElement('div');
                        dragHandle.className = 'drag-handle';
                        dragHandle.innerHTML = `
                            <svg width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="3" cy="3" r="2" fill="#888888"/>
                                <circle cx="9" cy="3" r="2" fill="#888888"/>
                                <circle cx="3" cy="10" r="2" fill="#888888"/>
                                <circle cx="9" cy="10" r="2" fill="#888888"/>
                                <circle cx="3" cy="17" r="2" fill="#888888"/>
                                <circle cx="9" cy="17" r="2" fill="#888888"/>
                            </svg>
                        `;
                        dragHandle.style.cursor = 'grab';
                        dragHandle.style.color = '#888';
                        dragHandle.style.marginRight = '4px';
                        dragHandle.style.display = 'flex';
                        dragHandle.style.alignItems = 'center';
                        
                        // Action dropdown
                        const actionDropdown = document.createElement('div');
                        actionDropdown.className = 'action-dropdown-wrapper';
                        actionDropdown.style.position = 'relative';
                        actionDropdown.style.width = '200px';
                        actionDropdown.style.flexShrink = '0';
                        actionDropdown.style.flexBasis = '200px';
                        actionDropdown.style.maxWidth = '200px';
                        
                        const actionButton = document.createElement('button');
                        actionButton.className = 'action-dropdown-button';
                        actionButton.style.display = 'flex';
                        actionButton.style.justifyContent = 'space-between';
                        actionButton.style.alignItems = 'center';
                        actionButton.style.width = '100%';
                        actionButton.style.padding = '6px 10px';
                        actionButton.style.height = '36px';
                        actionButton.style.boxSizing = 'border-box';
                        actionButton.style.backgroundColor = '#9C6CE9';
                        actionButton.style.border = '1px solid #8A5CD8';
                        actionButton.style.borderRadius = '4px';
                        actionButton.style.color = 'white';
                        actionButton.style.cursor = 'pointer';
                        actionButton.style.textAlign = 'left';
                        
                        actionButton.innerHTML = `
                            <span>${COMMAND_TYPES[cmd.action]?.displayName || cmd.action}</span>
                            <span class="dropdown-arrow" style="margin-left: 15px;">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                        `;
                        
                        let actionDropdownMenu = null;
                        
                        actionButton.onclick = (e) => {
                            e.stopPropagation();
                            
                            if (actionDropdownMenu) {
                                actionDropdownMenu.remove();
                                actionDropdownMenu = null;
                                return;
                            }
                            
                            // Create dropdown menu
                            actionDropdownMenu = document.createElement('div');
                            actionDropdownMenu.className = 'action-dropdown-menu';
                            actionDropdownMenu.style.position = 'fixed';
                            actionDropdownMenu.style.zIndex = '10000';
                            
                            // Calculate position based on button's position
                            const buttonRect = actionButton.getBoundingClientRect();
                            actionDropdownMenu.style.top = `${buttonRect.bottom + 4}px`;
                            actionDropdownMenu.style.left = `${buttonRect.left}px`;
                            actionDropdownMenu.style.width = `${buttonRect.width}px`;
                            
                            actionDropdownMenu.style.backgroundColor = '#9C6CE9';
                            actionDropdownMenu.style.border = '1px solid #8A5CD8';
                            actionDropdownMenu.style.borderRadius = '4px';
                            actionDropdownMenu.style.maxHeight = '300px';
                            actionDropdownMenu.style.overflowY = 'auto';
                            actionDropdownMenu.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                            
                            // Add options
                            Object.entries(COMMAND_TYPES).forEach(([action, config]) => {
                                if (action !== 'poly') { // Avoid recursion
                                    const option = document.createElement('div');
                                    option.className = 'action-option';
                                    option.textContent = config.displayName || action;
                                    option.style.padding = '8px 12px';
                                    option.style.cursor = 'pointer';
                                    option.style.color = 'white';
                                    
                                    if (action === cmd.action) {
                                        option.style.backgroundColor = '#8A5CD8';
                                    }
                                    
                                    option.onmouseover = () => {
                                        option.style.backgroundColor = '#8A5CD8';
                                    };
                                    
                                    option.onmouseout = () => {
                                        if (action !== cmd.action) {
                                            option.style.backgroundColor = '';
                                        }
                                    };
                                    
                                    option.onclick = () => {
                                        const oldAction = cmd.action;
                                        cmd.action = action;
                                        
                                        // Update button text
                                        actionButton.innerHTML = `
                                            <span>${config.displayName || action}</span>
                                            <span class="dropdown-arrow" style="margin-left: 15px;">
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </span>
                                        `;
                                        
                                        // If action type changed, update the args input
                                        if (oldAction !== action) {
                                            // Reset args if action type changed
                                            cmd.args = [];
                                            
                                            // Re-render the command list to update the args input
                                            renderCommandList();
                                        }
                                        
                                        // Auto-save
                                        wrapper.dataset.value = JSON.stringify(polyCommands);
                                        this.saveCommands();
                                        
                                        // Close dropdown
                                        actionDropdownMenu.remove();
                                        actionDropdownMenu = null;
                                    };
                                    
                                    actionDropdownMenu.appendChild(option);
                                }
                            });
                            
                            actionDropdown.appendChild(actionDropdownMenu);
                            
                            // Close dropdown when clicking outside
                            const closeActionDropdown = (e) => {
                                if (!actionDropdownMenu.contains(e.target) && !actionButton.contains(e.target)) {
                                    actionDropdownMenu.remove();
                                    actionDropdownMenu = null;
                                    document.removeEventListener('click', closeActionDropdown);
                                }
                            };
                            
                            document.addEventListener('click', closeActionDropdown);
                        };
                        
                        actionDropdown.appendChild(actionButton);
                        
                        // Args input based on action type
                        const argsContainer = document.createElement('div');
                        argsContainer.className = 'args-container';
                        argsContainer.style.flex = '1';
                        argsContainer.style.width = 'calc(100% - 200px - 40px)';
                        argsContainer.style.marginLeft = '10px';
                        argsContainer.style.height = '36px';
                        argsContainer.style.boxSizing = 'border-box';
                        argsContainer.style.display = 'flex';
                        argsContainer.style.alignItems = 'center';
                        
                        const actionConfig = COMMAND_TYPES[cmd.action];
                        
                        if (actionConfig) {
                            if (actionConfig.type === 'none') {
                                const noArgsMsg = document.createElement('span');
                                noArgsMsg.textContent = 'No parameters needed';
                                noArgsMsg.style.color = '#aaa';
                                noArgsMsg.style.fontStyle = 'italic';
                                noArgsMsg.style.height = '36px';
                                noArgsMsg.style.display = 'flex';
                                noArgsMsg.style.alignItems = 'center';
                                noArgsMsg.style.padding = '6px 10px';
                                noArgsMsg.style.boxSizing = 'border-box';
                                argsContainer.appendChild(noArgsMsg);
                            } else if (actionConfig.type === 'select') {
                                // Create select dropdown
                                const selectWrapper = document.createElement('div');
                                selectWrapper.className = 'select-wrapper';
                                selectWrapper.style.position = 'relative';
                                selectWrapper.style.width = '100%';
                                selectWrapper.style.height = '36px';
                                selectWrapper.style.boxSizing = 'border-box';
                                
                                const selectButton = document.createElement('button');
                                selectButton.className = 'select-button';
                                selectButton.style.display = 'flex';
                                selectButton.style.justifyContent = 'space-between';
                                selectButton.style.alignItems = 'center';
                                selectButton.style.width = '100%';
                                selectButton.style.height = '36px';
                                selectButton.style.padding = '6px 10px';
                                selectButton.style.boxSizing = 'border-box';
                                selectButton.style.backgroundColor = '#9C6CE9';
                                selectButton.style.border = '1px solid #8A5CD8';
                                selectButton.style.borderRadius = '4px';
                                selectButton.style.color = 'white';
                                selectButton.style.cursor = 'pointer';
                                selectButton.style.textAlign = 'left';
                                
                                // Default selected option
                                const selectedOption = cmd.args && cmd.args[0] ? cmd.args[0] : actionConfig.options[0];
                                
                                selectButton.innerHTML = `
                                    <span>${selectedOption}</span>
                                    <span class="dropdown-arrow" style="margin-left: 15px;">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </span>
                                `;
                                
                                let selectDropdownMenu = null;
                                
                                selectButton.onclick = (e) => {
                                    e.stopPropagation();
                                    
                                    if (selectDropdownMenu) {
                                        selectDropdownMenu.remove();
                                        selectDropdownMenu = null;
                                        return;
                                    }
                                    
                                    // Create dropdown menu
                                    selectDropdownMenu = document.createElement('div');
                                    selectDropdownMenu.className = 'select-dropdown-menu';
                                    selectDropdownMenu.style.position = 'fixed';
                                    selectDropdownMenu.style.zIndex = '10000';
                                    
                                    // Calculate position based on button's position
                                    const buttonRect = selectButton.getBoundingClientRect();
                                    selectDropdownMenu.style.top = `${buttonRect.bottom + 4}px`;
                                    selectDropdownMenu.style.left = `${buttonRect.left}px`;
                                    selectDropdownMenu.style.width = `${buttonRect.width}px`;
                                    
                                    selectDropdownMenu.style.backgroundColor = '#9C6CE9';
                                    selectDropdownMenu.style.border = '1px solid #8A5CD8';
                                    selectDropdownMenu.style.borderRadius = '4px';
                                    selectDropdownMenu.style.maxHeight = '300px';
                                    selectDropdownMenu.style.overflowY = 'auto';
                                    selectDropdownMenu.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                                    
                                    // Add options
                                    actionConfig.options.forEach(option => {
                                        const optionEl = document.createElement('div');
                                        optionEl.className = 'select-option';
                                        optionEl.textContent = option;
                                        optionEl.style.padding = '8px 12px';
                                        optionEl.style.cursor = 'pointer';
                                        optionEl.style.color = 'white';
                                        
                                        if (option === selectedOption) {
                                            optionEl.style.backgroundColor = '#8A5CD8';
                                        }
                                        
                                        optionEl.onmouseover = () => {
                                            optionEl.style.backgroundColor = '#8A5CD8';
                                        };
                                        
                                        optionEl.onmouseout = () => {
                                            if (option !== selectedOption) {
                                                optionEl.style.backgroundColor = '';
                                            }
                                        };
                                        
                                        optionEl.onclick = () => {
                                            // Update command args
                                            cmd.args = [option];
                                            
                                            // Update button text
                                            selectButton.innerHTML = `
                                                <span>${option}</span>
                                                <span class="dropdown-arrow" style="margin-left: 15px;">
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </span>
                                            `;
                                            
                                            // Auto-save
                                            wrapper.dataset.value = JSON.stringify(polyCommands);
                                            this.saveCommands();
                                            
                                            // Close dropdown
                                            selectDropdownMenu.remove();
                                            selectDropdownMenu = null;
                                        };
                                        
                                        selectDropdownMenu.appendChild(optionEl);
                                    });
                                    
                                    selectWrapper.appendChild(selectDropdownMenu);
                                    
                                    // Close dropdown when clicking outside
                                    const closeSelectDropdown = (e) => {
                                        if (!selectDropdownMenu.contains(e.target) && !selectButton.contains(e.target)) {
                                            selectDropdownMenu.remove();
                                            selectDropdownMenu = null;
                                            document.removeEventListener('click', closeSelectDropdown);
                                        }
                                    };
                                    
                                    document.addEventListener('click', closeSelectDropdown);
                                };
                                
                                selectWrapper.appendChild(selectButton);
                                argsContainer.appendChild(selectWrapper);
                            } else {
                                // Text input for URL or text
                                const textArg = document.createElement('input');
                                textArg.type = 'text';
                                textArg.className = 'arg-input';
                                textArg.placeholder = actionConfig.placeholder || 'Enter argument';
                                textArg.style.width = '100%';
                                textArg.style.padding = '6px 10px';
                                textArg.style.height = '36px';
                                textArg.style.boxSizing = 'border-box';
                                textArg.style.backgroundColor = '#444';
                                textArg.style.border = 'none';
                                textArg.style.borderRadius = '4px';
                                textArg.style.color = 'white';
                                
                                // Set current value if exists
                                if (cmd.args && cmd.args[0]) {
                                    textArg.value = cmd.args[0];
                                }
                                
                                // Save on change
                                textArg.onchange = () => {
                                    cmd.args = [textArg.value];
                                    
                                    // Auto-save
                                    wrapper.dataset.value = JSON.stringify(polyCommands);
                                    this.saveCommands();
                                };
                                
                                argsContainer.appendChild(textArg);
                            }
                        }
                        
                        // Delete button
                        const deleteBtn = document.createElement('button');
                        deleteBtn.innerHTML = '&times;';
                        deleteBtn.title = 'Delete Command';
                        deleteBtn.style.backgroundColor = 'transparent';
                        deleteBtn.style.color = '#888';
                        deleteBtn.style.border = 'none';
                        deleteBtn.style.borderRadius = '4px';
                        deleteBtn.style.fontSize = '20px';
                        deleteBtn.style.cursor = 'pointer';
                        deleteBtn.style.padding = '0 8px';
                        deleteBtn.style.paddingLeft = '20px';
                        deleteBtn.style.marginRight = '-10px';
                        deleteBtn.style.lineHeight = '1';
                        deleteBtn.style.transition = 'color 0.2s ease';
                        
                        deleteBtn.onmouseover = () => {
                            deleteBtn.style.color = '#d9534f';
                        };
                        
                        deleteBtn.onmouseout = () => {
                            deleteBtn.style.color = '#888';
                        };
                        
                        deleteBtn.onclick = (e) => {
                            e.stopPropagation();
                            polyCommands.splice(index, 1);
                            renderCommandList();
                            
                            // Auto-save when removing a command
                            wrapper.dataset.value = JSON.stringify(polyCommands);
                            this.saveCommands();
                        };
                        
                        // Assemble command item
                        cmdItem.appendChild(dragHandle);
                        cmdItem.appendChild(actionDropdown);
                        cmdItem.appendChild(argsContainer);
                        cmdItem.appendChild(deleteBtn);
                        
                        sortableList.appendChild(cmdItem);
                    });
                    
                    // Add drag and drop event listeners to the sortable list
                    sortableList.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        const draggingItem = sortableList.querySelector('.dragging');
                        if (!draggingItem) return;
                        
                        // Find the item we're dragging over
                        const siblings = [...sortableList.querySelectorAll('.poly-command-item:not(.dragging)')];
                        const nextSibling = siblings.find(sibling => {
                            const box = sibling.getBoundingClientRect();
                            const offset = e.clientY - box.top - box.height / 2;
                            return offset < 0;
                        });
                        
                        if (nextSibling) {
                            sortableList.insertBefore(draggingItem, nextSibling);
                        } else {
                            sortableList.appendChild(draggingItem);
                        }
                    });
                    
                    sortableList.addEventListener('drop', (e) => {
                        e.preventDefault();
                        
                        // Reorder the commands array based on the new DOM order
                        const newOrder = [];
                        sortableList.querySelectorAll('.poly-command-item').forEach(item => {
                            const index = parseInt(item.dataset.index);
                            if (!isNaN(index) && index >= 0 && index < polyCommands.length) {
                                newOrder.push(polyCommands[index]);
                            }
                        });
                        
                        if (newOrder.length === polyCommands.length) {
                            polyCommands = newOrder;
                            
                            // Update the indices
                            sortableList.querySelectorAll('.poly-command-item').forEach((item, idx) => {
                                item.dataset.index = idx;
                            });
                            
                            // Auto-save after reordering
                            wrapper.dataset.value = JSON.stringify(polyCommands);
                            this.saveCommands();
                        }
                    });
                    
                    commandListContainer.appendChild(sortableList);
                };
                
                // Add command button
                const addButton = document.createElement('button');
                addButton.textContent = 'Add Command';
                addButton.style.backgroundColor = '#9C6CE9';
                addButton.style.color = 'white';
                addButton.style.padding = '8px 16px';
                addButton.style.border = 'none';
                addButton.style.borderRadius = '4px';
                addButton.style.cursor = 'pointer';
                addButton.style.width = '100%';
                addButton.style.marginTop = '10px';
                addButton.style.textAlign = 'center';
                
                addButton.onclick = () => {
                    // Add a new command with default values
                    const defaultAction = Object.keys(COMMAND_TYPES).find(key => key !== 'poly');
                    polyCommands.push({
                        action: defaultAction,
                        args: []
                    });
                    
                    // Render the updated list
                    renderCommandList();
                    
                    // Auto-save
                    wrapper.dataset.value = JSON.stringify(polyCommands);
                    this.saveCommands();
                };
                
                // Buttons container
                const buttonsContainer = document.createElement('div');
                buttonsContainer.style.display = 'flex';
                buttonsContainer.style.width = '100%';
                
                buttonsContainer.appendChild(addButton);
                
                // Assemble modal
                modal.appendChild(header);
                modal.appendChild(commandListContainer);
                modal.appendChild(buttonsContainer);
                
                // Render initial command list
                renderCommandList();
                
                // Add modal to overlay
                overlay.appendChild(modal);
                
                // Add overlay to body
                document.body.appendChild(overlay);
                
                // Close modal when clicking outside
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        savePolyConfiguration();
                        document.body.removeChild(overlay);
                    }
                });
            };
            
            // Set initial button text
            if (polyCommands.length > 0) {
                polyButton.textContent = `${polyCommands.length} Command${polyCommands.length !== 1 ? 's' : ''} Configured`;
            }
            
            wrapper.appendChild(polyButton);
            
            // Add a method to get the value
            wrapper.getValue = () => wrapper.dataset.value;
            
            input = wrapper;
        } else if (config.type === 'select') {
            // For select types, create a custom dropdown that looks like the action button
            const wrapper = document.createElement('div');
            wrapper.className = 'select-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.width = '100%';
            wrapper.style.height = '36px';
            wrapper.style.boxSizing = 'border-box';
            
            const selectButton = document.createElement('button');
            selectButton.className = 'action-value';
            selectButton.style.display = 'flex';
            selectButton.style.justifyContent = 'space-between';
            selectButton.style.alignItems = 'center';
            selectButton.style.width = '100%';
            selectButton.style.height = '36px';
            selectButton.style.padding = '6px 10px';
            selectButton.style.boxSizing = 'border-box';
            selectButton.style.backgroundColor = '#9C6CE9';
            selectButton.style.border = '1px solid #8A5CD8';
            selectButton.style.borderRadius = '4px';
            selectButton.style.color = 'white';
            selectButton.style.textAlign = 'left';
            selectButton.style.cursor = 'pointer';
            
            // Find the selected option or use the first one
            const selectedOption = value || config.options[0];
            
            selectButton.innerHTML = `
                <span>${selectedOption}</span>
                <span class="dropdown-arrow" style="margin-left: 15px;">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
                selectDropdown.style.position = 'fixed';
                selectDropdown.style.zIndex = '10000';
                
                // Calculate position based on button's position
                const buttonRect = selectButton.getBoundingClientRect();
                selectDropdown.style.top = `${buttonRect.bottom + 4}px`;
                selectDropdown.style.left = `${buttonRect.left}px`;
                selectDropdown.style.width = `${buttonRect.width}px`;
                
                selectDropdown.style.backgroundColor = '#9C6CE9';
                selectDropdown.style.border = '1px solid #8A5CD8';
                selectDropdown.style.borderRadius = '4px';
                selectDropdown.style.maxHeight = '300px';
                selectDropdown.style.overflowY = 'auto';
                selectDropdown.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                
                // Add options to dropdown
                config.options.forEach(option => {
                    const optionElement = document.createElement('div');
                    optionElement.className = 'select-option';
                    optionElement.textContent = option;
                    
                    if (option === selectedOption) {
                        optionElement.style.backgroundColor = '#8A5CD8';
                    }
                    
                    optionElement.onmouseover = () => {
                        optionElement.style.backgroundColor = '#8A5CD8';
                    };
                    
                    optionElement.onmouseout = () => {
                        if (option !== selectedOption) {
                            optionElement.style.backgroundColor = '';
                        }
                    };
                    
                    optionElement.onclick = () => {
                        // Update button text
                        selectButton.innerHTML = `
                            <span>${option}</span>
                            <span class="dropdown-arrow" style="margin-left: 15px;">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
            input.style.width = '100%';
            input.style.height = '36px';
            input.style.padding = '6px 10px';
            input.style.boxSizing = 'border-box';
            input.style.backgroundColor = '#444';
            input.style.border = 'none';
            input.style.borderRadius = '4px';
            input.style.color = 'white';
            
            // Add a method to get the value
            input.getValue = () => input.value;
        } else if (config.type === 'none') {
            input = document.createElement('span');
            input.className = 'action-value no-input';
            input.textContent = 'No parameters needed';
            input.style.opacity = '0.5';
            input.style.fontStyle = 'italic';
            input.style.height = '36px';
            input.style.display = 'flex';
            input.style.alignItems = 'center';
            input.style.padding = '6px 10px';
            input.style.boxSizing = 'border-box';
            
            // Add a method to get the value
            input.getValue = () => '';
        } else {
            console.error('Unknown command type:', config.type);
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'command-value action-value';
            input.placeholder = 'Value';
            input.value = value || '';
            
            // Add a method to get the value
            input.getValue = () => input.value;
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