// Test script to check if commands are stored correctly
async function testCommands() {
  try {
    // Get commands from storage
    const { commands } = await chrome.storage.sync.get(['commands']);
    console.log('Commands from storage:', commands);
    
    if (!commands || Object.keys(commands).length === 0) {
      console.log('No commands found in storage');
      
      // Set default commands
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
        's': {
          action: 'search',
          args: ['google'],
          description: 'Search on Google'
        }
      };
      
      console.log('Setting default commands:', DEFAULT_COMMANDS);
      await chrome.storage.sync.set({ commands: DEFAULT_COMMANDS });
      console.log('Default commands set');
      
      // Verify commands were set
      const { commands: updatedCommands } = await chrome.storage.sync.get(['commands']);
      console.log('Updated commands from storage:', updatedCommands);
    }
  } catch (error) {
    console.error('Error testing commands:', error);
  }
}

// Run the test
testCommands(); 