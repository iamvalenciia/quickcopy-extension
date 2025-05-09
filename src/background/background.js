/**
 * Background script for QuickCopy extension
 *
 * Manages message templates storage, clipboard operations,
 * and communication between extension components.
 */

// Default message templates for initial setup
const DEFAULT_TEMPLATES = {
  "welcome": [
    "Welcome! How can I assist you today?",
    "Hello! I'm here to help you.",
    "Hi there! What can I do for you?",
  ],
  "support": [
    "I understand your concern. Let me help you with that.",
    "I'll be happy to assist you with this matter.",
    "Let me look into this for you right away.",
  ],
  "follow-up": [
    "Is there anything else you need help with?",
    "Let me know if you need any clarification.",
    "Feel free to ask if you have any questions.",
  ],
  "closing": [
    "Thank you for your patience. Have a great day!",
    "I'm glad I could help. Take care!",
    "Let me know if you need anything else. Have a wonderful day!",
  ]
};

/**
 * Handles extension installation and update events
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  // Initialize message templates if not already present
  initializeMessageTemplates();

  // Notify content scripts and ensure they're properly installed
  notifyAllTabs({ action: "extensionValid" });
});

/**
 * Handles extension startup
 */
chrome.runtime.onStartup.addListener(() => {
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