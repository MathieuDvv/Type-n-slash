// Command handlers for different types of actions
const commandHandlers = {
    openTab: async (url) => {
        if (!url) return;
        await chrome.tabs.create({ url: url.startsWith('http') ? url : `https://${url}` });
    },
    
    search: async (searchEngine = 'google', query) => {
        if (!query) {
            // If no query, open the search engine homepage
            const homepages = {
                youtube: 'https://www.youtube.com',
                google: 'https://www.google.com',
                duckduckgo: 'https://duckduckgo.com',
                bing: 'https://www.bing.com',
                brave: 'https://search.brave.com'
            };
            await chrome.tabs.create({ url: homepages[searchEngine] || homepages.google });
            return;
        }

        const searchUrls = {
            youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
            brave: `https://search.brave.com/search?q=${encodeURIComponent(query)}`
        };

        await chrome.tabs.create({ url: searchUrls[searchEngine] || searchUrls.google });
    },
    
    clearHistory: async (timeRange = 'hour') => {
        const ranges = {
            hour: 3600 * 1000,
            day: 24 * 3600 * 1000,
            week: 7 * 24 * 3600 * 1000,
            all: undefined
        };
        
        await chrome.history.deleteAll();
    },
    
    clearCache: async () => {
        await chrome.browsingData.removeCache({});
    },
    
    downloadPage: async (format = 'html') => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return;

        if (format === 'pdf') {
            await chrome.downloads.download({
                url: tab.url,
                filename: `${tab.title || 'page'}.pdf`,
                saveAs: true
            });
        } else {
            await chrome.downloads.download({
                url: tab.url,
                filename: `${tab.title || 'page'}.html`,
                saveAs: true
            });
        }
    },
    
    openDevTools: async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) return;
            
            // Try to open DevTools programmatically
            // This is a workaround since Chrome doesn't provide a direct API to open DevTools
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    // Try to open DevTools using keyboard shortcut simulation
                    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                    if (isMac) {
                        // Command+Option+I for Mac
                        window.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'i',
                            code: 'KeyI',
                            metaKey: true,
                            altKey: true,
                            bubbles: true
                        }));
                    } else {
                        // Ctrl+Shift+I for Windows/Linux
                        window.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'i',
                            code: 'KeyI',
                            ctrlKey: true,
                            shiftKey: true,
                            bubbles: true
                        }));
                    }
                    
                    // As a fallback, also try to use the console API
                    console.clear();
                    console.log('%c DevTools opened by Type\'n\'Slash', 'font-size: 20px; color: #9C6CE9; font-weight: bold;');
                }
            });
        } catch (error) {
            console.error('Error opening DevTools:', error);
            
            // Fallback: try to open chrome://inspect
            await chrome.tabs.create({ url: 'chrome://inspect/#devices' });
        }
    },

    openOptions: async () => {
        await chrome.runtime.openOptionsPage();
    },
    
    copy_url: async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url) return;

        // Send message to content script to copy URL
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
            try {
                await chrome.tabs.sendMessage(activeTab.id, {
                    type: 'COPY_URL',
                    url: tab.url
                });
            } catch (error) {
                // If content script is not ready, inject it first
                await chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    func: (url) => {
                        const input = document.createElement('input');
                        input.value = url;
                        document.body.appendChild(input);
                        input.select();
                        document.execCommand('copy');
                        input.remove();
                    },
                    args: [tab.url]
                });
            }
        }
    },
    
    executeCommand: async (command) => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;
        
        try {
            // Execute the command in the current tab
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (cmd) => {
                    try {
                        // Use Function constructor to evaluate the command
                        // This allows for multi-line commands and variable declarations
                        return new Function(cmd)();
                    } catch (error) {
                        console.error('Error executing command:', error);
                        return { error: error.message };
                    }
                },
                args: [command || '']
            });
        } catch (error) {
            console.error('Error executing script:', error);
        }
    },
    
    reloadPage: async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;
        
        await chrome.tabs.reload(tab.id);
    }
};

// Default commands
const DEFAULT_COMMANDS = {
    'gh': {
        action: 'openTab',
        args: ['https://github.com'],
        description: 'Open GitHub'
    },
    'yt': {
        action: 'search',
        args: ['youtube'],
        description: 'Search on YouTube or open YouTube'
    },
    's': {
        action: 'search',
        args: ['google'],
        description: 'Search on Google'
    },
    'ddg': {
        action: 'search',
        args: ['duckduckgo'],
        description: 'Search on DuckDuckGo'
    },
    'bing': {
        action: 'search',
        args: ['bing'],
        description: 'Search on Bing'
    },
    'brave': {
        action: 'search',
        args: ['brave'],
        description: 'Search on Brave'
    },
    'clear': {
        action: 'clearHistory',
        description: 'Clear browsing history'
    },
    'cache': {
        action: 'clearCache',
        description: 'Clear browser cache'
    },
    'dev': {
        action: 'openDevTools',
        description: 'Open Developer Tools'
    },
    'dl': {
        action: 'downloadPage',
        args: ['html'],
        description: 'Download current page as HTML'
    },
    'pdf': {
        action: 'downloadPage',
        args: ['pdf'],
        description: 'Download current page as PDF'
    },
    'options': {
        action: 'openOptions',
        description: 'Open Type\'n\'Slash options'
    },
    'vs': {
        action: 'openTab',
        args: ['https://vscode.dev'],
        description: 'Open VS Code online'
    },
    'gen': {
        action: 'openTab',
        args: ['https://genipedia.org'],
        description: 'Open Genipedia'
    },
    'gml': {
        action: 'openTab',
        args: ['https://mail.google.com'],
        description: 'Open Gmail'
    }
};

// Initialize commands in storage if not exists
chrome.runtime.onInstalled.addListener(async () => {
    const { commands } = await chrome.storage.sync.get(['commands']);
    if (!commands) {
        await chrome.storage.sync.set({ 
            commands: DEFAULT_COMMANDS,
            settings: { activationKey: '/' }
        });
    }
});

// Handle command execution requests from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'EXECUTE_COMMAND') {
        const { command } = request;
        
        if (command?.action && commandHandlers[command.action]) {
            const handler = commandHandlers[command.action];
            
            // Execute the command with its arguments
            handler(...(command.args || []))
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            
            return true; // Keep the message channel open for the async response
        }
    }
    return false;
}); 