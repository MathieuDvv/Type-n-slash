// Debug script to log any errors in the options page
console.log('Debug script loaded');

// Log any errors that occur
window.addEventListener('error', function(event) {
  console.error('Error caught by debug script:', event.error);
});

// Check if commands are loaded correctly
async function checkCommands() {
  try {
    const { commands } = await chrome.storage.sync.get(['commands']);
    console.log('Commands from storage:', commands);
    
    // Check if command-list element exists
    const commandList = document.getElementById('command-list');
    console.log('Command list element:', commandList);
    console.log('Command list HTML:', commandList ? commandList.innerHTML : 'N/A');
    console.log('Command list children:', commandList ? commandList.children.length : 'N/A');
    
    // Check if OptionsManager is initialized
    if (window.optionsManager) {
      console.log('OptionsManager instance:', window.optionsManager);
      console.log('OptionsManager commands:', window.optionsManager.commands);
      console.log('OptionsManager commands size:', window.optionsManager.commands.size);
      
      // Check if renderCommands method exists and is callable
      if (typeof window.optionsManager.renderCommands === 'function') {
        console.log('renderCommands method exists');
        // Try calling renderCommands manually
        try {
          window.optionsManager.renderCommands();
          console.log('renderCommands called successfully');
          console.log('Command list HTML after renderCommands:', commandList.innerHTML);
        } catch (error) {
          console.error('Error calling renderCommands:', error);
        }
      } else {
        console.log('renderCommands method does not exist');
      }
    } else {
      console.log('OptionsManager not initialized');
    }
  } catch (error) {
    console.error('Error checking commands:', error);
  }
}

// Run the check after a short delay to ensure the page is loaded
setTimeout(checkCommands, 1000); 