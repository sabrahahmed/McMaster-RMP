document.addEventListener('DOMContentLoaded', function () {
    const toggleInput = document.querySelector('input[type="checkbox"]');

    toggleInput.addEventListener('change', function () {
      chrome.runtime.sendMessage({ toggleExtension: toggleInput.checked });
  
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];
        // Refresh the page when extension is activated/deactivated
        chrome.runtime.sendMessage({ refreshPage: true });
      });
    });
  
    // Retrieve the toggle state from storage
    chrome.storage.local.get('extensionState', function (data) {
      if (data.extensionState !== undefined) {
        toggleInput.checked = data.extensionState;
      }
    });
});
