/**
 * Background script for QuickCopy extension
 *
 * Manages message templates storage, clipboard operations,
 * and communication between extension components.
 */

// Default message templates for initial setup
const DEFAULT_TEMPLATES = {
  "tax-pending-task": [
    "The tax team is currently reviewing your case.",
    "Your tax request is in the verification process.",
  ],
  "tax-on-hold": [
    "Your tax case is on hold due to pending documentation.",
    "We need additional information to continue with your tax process.",
  ],
  banking: [
    "Your banking application is being processed.",
    "Funds will be deposited within 2-3 business days.",
  ],
  "banking-on-hold": [
    "The nearest office is located at 123 Main St.",
    "Our hours of operation are Monday to Friday 9am to 5pm.",
  ],
};

/**
 * Handles extension installation and update events
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed or updated:", details.reason);

  // Initialize message templates if not already present
  initializeMessageTemplates();

  // Notify content scripts and ensure they're properly installed
  notifyAllTabs({ action: "extensionValid" });
  // reinstallContentScripts();
});

/**
 * Handles extension startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started");
  notifyAllTabs({ action: "extensionValid" });
});

/**
 * Initializes default message templates if none exist
 */
async function initializeMessageTemplates() {
  try {
    const result = await chrome.storage.local.get("messageData");
    if (!result.messageData) {
      await chrome.storage.local.set({ messageData: DEFAULT_TEMPLATES });
    }
  } catch (error) {
    console.error("Error initializing message templates:", error);
  }
}

/**
 * Sends a message to all active tabs
 * @param {Object} message - The message to send
 */
function notifyAllTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error("Error querying tabs:", chrome.runtime.lastError);
      return;
    }

    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Expected to fail for tabs where content script isn't injected
      });
    }
  });
}

/**
 * Handles messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "getMessageData":
      handleGetMessageData(sendResponse);
      break;
    case "saveMessageData":
      handleSaveMessageData(request.data, sendResponse);
      break;
    case "copyToClipboard":
      handleCopyToClipboard(request.text, sendResponse);
      break;
  }
  return true; // Required for asynchronous response
});

/**
 * Retrieves message templates from storage
 * @param {Function} sendResponse - Callback function to send response
 */
function handleGetMessageData(sendResponse) {
  chrome.storage.local.get("messageData", (result) => {
    sendResponse({ data: result.messageData || null });
  });
}

/**
 * Saves message templates to storage
 * @param {Object} data - Message templates to save
 * @param {Function} sendResponse - Callback function to send response
 */
function handleSaveMessageData(data, sendResponse) {
  chrome.storage.local.set({ messageData: data }, () => {
    if (chrome.runtime.lastError) {
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message,
      });
    } else {
      sendResponse({ success: true });
    }
  });
}

/**
 * Copies text to clipboard using the best available method
 * @param {string} text - Text to copy to clipboard
 * @param {Function} sendResponse - Callback function to send response
 */
function handleCopyToClipboard(text, sendResponse) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // Use modern Clipboard API if available
    navigator.clipboard
      .writeText(text)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error("Clipboard API error:", error);
        // Fall back to legacy method
        copyToClipboardFallback(text, sendResponse);
      });
  } else {
    // Use legacy method if Clipboard API not available
    copyToClipboardFallback(text, sendResponse);
  }
}

/**
 * Legacy method for copying text to clipboard
 * @param {string} text - Text to copy to clipboard
 * @param {Function} sendResponse - Callback function to send response
 */
function copyToClipboardFallback(text, sendResponse) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    sendResponse({
      success: successful,
      error: successful ? null : "execCommand failed",
    });
  } catch (error) {
    console.error("Fallback clipboard error:", error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Reinstalls content scripts on existing tabs that match patterns
 * Compatible with Manifest V3
 */
// function reinstallContentScripts() {
//   const manifest = chrome.runtime.getManifest();
//   const contentScripts = manifest.content_scripts || [];

//   contentScripts.forEach((scriptConfig) => {
//     if (!scriptConfig.js || !scriptConfig.matches) return;

//     chrome.tabs.query({ url: scriptConfig.matches }, (tabs) => {
//       if (chrome.runtime.lastError) {
//         console.error("Error querying tabs:", chrome.runtime.lastError);
//         return;
//       }

//       tabs.forEach((tab) => {
//         scriptConfig.js.forEach((jsFile) => {
//           chrome.scripting
//             .executeScript({
//               target: { tabId: tab.id },
//               files: [jsFile],
//             })
//             .then(() => {
//               chrome.tabs
//                 .sendMessage(tab.id, { action: "extensionValid" })
//                 .catch(() => {
//                   // Expected to fail if content script not ready
//                 });
//             })
//             .catch(() => {
//               // Expected to fail for restricted tabs
//             });
//         });
//       });
//     });
//   });
// }
