// Background script for QuickCopy extension

// Handle installation and update events
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed or updated:", details.reason);

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

  // Notify all content scripts that the extension is valid
  notifyContentScripts({ action: "extensionValid" });
});

// Handle extension startup
chrome.runtime.onStartup.addListener(function () {
  console.log("Extension started");

  // Notify all content scripts that the extension is valid
  notifyContentScripts({ action: "extensionValid" });
});

// Function to notify all content scripts
function notifyContentScripts(message) {
  chrome.tabs.query({}, function (tabs) {
    if (chrome.runtime.lastError) {
      console.error("Error querying tabs:", chrome.runtime.lastError);
      return;
    }

    for (const tab of tabs) {
      try {
        chrome.tabs.sendMessage(tab.id, message, function (response) {
          if (chrome.runtime.lastError) {
            // This is normal for tabs where content script isn't injected
            // No need to log this error
          }
        });
      } catch (error) {
        console.error("Error sending message to tab:", tab.id, error);
      }
    }
  });
}

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
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(request.text)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error("Clipboard API error:", error);

            // Fall back to execCommand method
            fallbackCopyToClipboard(request.text, sendResponse);
          });
      } else {
        // Use fallback method if Clipboard API not available
        fallbackCopyToClipboard(request.text, sendResponse);
      }
    } catch (error) {
      console.error("Background clipboard error:", error);
      sendResponse({ success: false, error: error.message });
    }

    return true; // Required for asynchronous response
  }
});

// Fallback clipboard method
function fallbackCopyToClipboard(text, sendResponse) {
  try {
    // Create a temporary textarea element to copy text
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (successful) {
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "execCommand failed" });
    }
  } catch (error) {
    console.error("Fallback clipboard error:", error);
    sendResponse({ success: false, error: error.message });
  }
}
