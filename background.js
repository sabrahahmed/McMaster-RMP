let extensionEnabled = true; // Initial extension state (turned on)

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.toggleExtension !== undefined) {
    if (message.toggleExtension) {
      extensionEnabled = true;
    } else {
      extensionEnabled = false;
    }
    
    // Store the toggle state in storage
    chrome.storage.local.set({ extensionState: extensionEnabled }, function() {
      sendResponse({ success: true });
    });

  } else if (message.getExtensionState !== undefined) {
    sendResponse({ extensionState: extensionEnabled });
  } else if (message.refreshPage !== undefined) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      chrome.tabs.reload(currentTab.id);
    });
  }
});
