// Load commands when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    // Get commands and settings from storage
    const { commands, settings, commandHistory } = await chrome.storage.sync.get(['commands', 'settings', 'commandHistory']);
    const commandList = document.getElementById('command-list');
    
    // Get activation key from settings
    const activationKey = settings?.activationKey || '/';
    
    // Handle settings button click
    const settingsButton = document.querySelector('.settings-button');
    settingsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    if (!commands || Object.keys(commands).length === 0) {
        commandList.innerHTML = `
            <div class="no-commands">
                <p>No commands configured yet.</p>
                <p>Click the settings icon to add commands.</p>
            </div>
        `;
        return;
    }

    // Get the last 5 used commands if available
    let recentCommands = [];
    if (commandHistory && commandHistory.length > 0) {
        // Get unique command names from history, most recent first
        const uniqueCommands = [...new Set(commandHistory)];
        recentCommands = uniqueCommands.slice(0, 5);
    }
    
    // Sort commands: first the recent ones, then alphabetically for the rest
    let sortedCommands = [];
    
    // First add recent commands in order
    if (recentCommands.length > 0) {
        recentCommands.forEach(cmdName => {
            if (commands[cmdName]) {
                sortedCommands.push([cmdName, commands[cmdName]]);
            }
        });
    }
    
    // Then add the rest alphabetically
    const remainingCommands = Object.entries(commands)
        .filter(([name]) => !recentCommands.includes(name))
        .sort(([a], [b]) => a.localeCompare(b));
    
    sortedCommands = [...sortedCommands, ...remainingCommands];

    // Create command buttons
    commandList.innerHTML = sortedCommands
        .map(([name, command]) => `
            <button class="command-button" title="${command.description || ''}" data-command="${name}">
                <div class="command-key">${activationKey}</div>
                ${name}
            </button>
        `)
        .join('');

    // Handle command button clicks
    document.querySelectorAll('.command-button').forEach(button => {
        button.addEventListener('click', async () => {
            const commandName = button.dataset.command;
            const commandText = `${activationKey}${commandName}`;
            
            // Copy to clipboard
            await navigator.clipboard.writeText(commandText);
            
            // Visual feedback
            const originalBorderColor = button.style.borderColor;
            button.style.borderColor = '#4CAF50';
            setTimeout(() => {
                button.style.borderColor = originalBorderColor;
            }, 500);
            
            // Update command history
            updateCommandHistory(commandName);
        });
    });
});

// Update command history
async function updateCommandHistory(commandName) {
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

// Load and display commands
async function loadCommands() {
    const { commands } = await chrome.storage.sync.get(['commands']);
    const commandList = document.getElementById('command-list');
    
    if (!commands || Object.keys(commands).length === 0) {
        commandList.innerHTML = `
            <div class="command-item">
                <div class="command-description">No commands configured yet. Click "Open Settings" to add commands.</div>
            </div>
        `;
        return;
    }
    
    // Sort commands by name
    const sortedCommands = Object.entries(commands)
        .sort(([a], [b]) => a.localeCompare(b));
    
    // Create command list HTML
    commandList.innerHTML = sortedCommands
        .map(([name, command]) => `
            <div class="command-item">
                <div>
                    <div class="command-name">${name}</div>
                    <div class="command-description">${command.description || ''}</div>
                </div>
            </div>
        `)
        .join('');
} 