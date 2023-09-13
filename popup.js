document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('toggleExtension');

    // Load the current extension state from storage
    chrome.storage.sync.get(['extensionEnabled'], function (result) {
        const extensionEnabled = result.extensionEnabled !== false;
        toggleButton.textContent = extensionEnabled ? 'Deactivate Extension' : 'Activate Extension';
    });

    // Toggle the extension state when the button is clicked
    toggleButton.addEventListener('click', function () {
        chrome.storage.sync.get(['extensionEnabled'], function (result) {
            const extensionEnabled = result.extensionEnabled !== false;

            // Toggle the extension state
            const newExtensionState = !extensionEnabled;
            chrome.storage.sync.set({ extensionEnabled: newExtensionState });

            // Update the button text
            toggleButton.textContent = newExtensionState ? 'Deactivate Extension' : 'Activate Extension';

            // Notify content.js to reactivate/deactivate the extension
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, { extensionEnabled: newExtensionState });
            });
        });
    });
});
