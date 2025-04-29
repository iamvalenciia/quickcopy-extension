// Background script for QuickCopy extension

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getMessageData") {
    // Retrieve message data from storage
    chrome.storage.local.get("messageData", function (result) {
      sendResponse({ data: result.messageData || null });
    });
    return true; // Required for asynchronous response
  }

  if (request.action === "saveMessageData") {
    // Save message data to storage
    chrome.storage.local.set({ messageData: request.data }, function () {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        sendResponse({ success: true });
      }
    });
    return true; // Required for asynchronous response
  }

  if (request.action === "copyToClipboard") {
    // Create a temporary textarea element to copy text
    const textarea = document.createElement("textarea");
    textarea.value = request.text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    sendResponse({ success: true });
    return true;
  }
});

// Initialize when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // Check if message data already exists
  chrome.storage.local.get("messageData", function (result) {
    if (!result.messageData) {
      // Set default template if no data exists
      const defaultTemplate = {
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

      chrome.storage.local.set({ messageData: defaultTemplate });
    }
  });
});

// Background script for QuickCopy extension

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getMessageData") {
    // Retrieve message data from storage
    chrome.storage.local.get("messageData", function (result) {
      sendResponse({ data: result.messageData || null });
    });
    return true; // Required for asynchronous response
  }

  if (request.action === "saveMessageData") {
    // Save message data to storage
    chrome.storage.local.set({ messageData: request.data }, function () {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        sendResponse({ success: true });
      }
    });
    return true; // Required for asynchronous response
  }

  if (request.action === "copyToClipboard") {
    // Create a temporary textarea element to copy text
    const textarea = document.createElement("textarea");
    textarea.value = request.text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    sendResponse({ success: true });
    return true;
  }
});

// Initialize when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // Check if message data already exists
  chrome.storage.local.get("messageData", function (result) {
    if (!result.messageData) {
      // Set default template if no data exists
      const defaultTemplate = {
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

      chrome.storage.local.set({ messageData: defaultTemplate });
    }
  });
});
