/**
 * Content script for QuickCopy extension
 *
 * Provides quick access to message templates via keyboard shortcut
 * and handles clipboard operations within the browser context.
 */

// State management
let isExtensionActive = true;

// DOM elements
let popupElement;

/**
 * Loads the popup HTML and initializes the popup element
 */
async function initializePopup() {
  try {
    const response = await fetch(chrome.runtime.getURL('src/content/popup.html'));
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Get the popup element from the loaded HTML
    const popup = doc.getElementById('quickcopy-popup');
    
    // Clone the popup and append it to the current document
    popupElement = popup.cloneNode(true);
    document.body.appendChild(popupElement);
    
    // Add the styles from the loaded HTML
    const styles = doc.getElementsByTagName('style');
    for (const style of styles) {
      document.head.appendChild(style.cloneNode(true));
    }
  } catch (error) {
    console.error('Failed to load popup HTML:', error);
    // Fallback to creating a basic popup element
    popupElement = document.createElement('div');
    popupElement.id = 'quickcopy-popup';
    document.body.appendChild(popupElement);
  }
}

// Initialize popup when the content script loads
initializePopup();

/**
 * Checks if the extension context is valid before making API calls
 */
function isExtensionValid() {
  if (!isExtensionActive) return false;
  
  try {
    chrome.runtime.getURL("");
    return true;
  } catch (error) {
    if (error.message.includes("Extension context invalidated")) {
      isExtensionActive = false;
      showErrorPopup("Extension was updated. Please refresh the page.");
    }
    return false;
  }
}

/**
 * Safely executes Chrome API calls with validation
 */
function executeSecurely(operation) {
  if (!isExtensionValid()) return false;

  try {
    return operation();
  } catch (error) {
    if (error.message.includes("Extension context invalidated")) {
      isExtensionActive = false;
      showErrorPopup("Extension was updated. Please refresh the page.");
    }
    throw error;
  }
}

/**
 * Displays error message in a popup
 */
function showErrorPopup(message) {
  popupElement.innerHTML = `
    <div class="quickcopy-error">
      <p>${message}</p>
    </div>
  `;

  positionPopupCentered();
  setTimeout(hidePopup, 3000);
}

/**
 * Positions the popup in the center of the viewport
 */
function positionPopupCentered() {
  popupElement.style.display = "block";

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  const popupWidth = popupElement.offsetWidth;
  const popupHeight = popupElement.offsetHeight;

  const centeredX = Math.max(0, (viewportWidth - popupWidth) / 2);
  const centeredY = Math.max(0, (viewportHeight - popupHeight) / 2);

  popupElement.style.left = centeredX + scrollX + "px";
  popupElement.style.top = centeredY + scrollY + "px";
}

/**
 * Hides the popup
 */
function hidePopup() {
  popupElement.style.display = "none";
}

/**
 * Displays a temporary notification when text is copied
 */
function showCopiedNotification(text) {
  const notification = document.createElement("div");
  notification.className = "quickcopy-notification";

  const maxDisplayLength = 50;
  const displayText =
    text.length > maxDisplayLength
      ? text.substring(0, maxDisplayLength) + "..."
      : text;

  notification.textContent = `Copied: "${displayText}"`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/**
 * Formats category names for display (converts kebab-case to Title Case)
 */
function formatCategoryName(category) {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Primary clipboard copy function with modern API support
 */
function copyToClipboard(text) {
  if (!isExtensionValid()) {
    showErrorPopup("Extension was updated. Please refresh the page.");
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch((error) => {
      console.error("Clipboard API error:", error);
      copyToClipboardFallback(text);
    });
  } else {
    copyToClipboardFallback(text);

    // Additional backup using background script
    executeSecurely(() => {
      chrome.runtime.sendMessage(
        { action: "copyToClipboard", text: text },
        (response) => {
          if (chrome.runtime.lastError) {
            isExtensionActive = false;
          }
        }
      );
    });
  }
}

/**
 * Fallback clipboard copy method for browsers without Clipboard API
 */
function copyToClipboardFallback(text) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!successful) {
      console.error("Fallback clipboard copy failed");
    }
  } catch (error) {
    console.error("Error in fallback clipboard copy:", error);
  }
}

/**
 * Updates the popup with matching messages based on search query
 */
function updateMessageResults(messageData, query) {
  const resultsContainer = document.createElement("div");
  resultsContainer.className = "quickcopy-results-container";

  const existingResults = popupElement.querySelector(
    ".quickcopy-results-container"
  );
  if (existingResults) {
    popupElement.removeChild(existingResults);
  }

  query = query || "";
  const matchingCategories = findMatchingCategories(messageData, query);

  if (matchingCategories.length > 0) {
    populateMatchingResults(resultsContainer, matchingCategories, query);
  } else {
    resultsContainer.innerHTML = `
      <div class="quickcopy-empty">
        <p>No matching messages found${query ? ` for "${query}"` : ""}.</p>
      </div>
    `;
  }

  popupElement.appendChild(resultsContainer);
  attachMessageClickHandlers();
}

/**
 * Finds categories with messages matching the search query
 */
function findMatchingCategories(messageData, query) {
  const matchingCategories = [];

  if (!query) {
    // Show all messages when query is empty
    for (const category in messageData) {
      matchingCategories.push({
        category: formatCategoryName(category),
        messages: messageData[category],
      });
    }
  } else {
    // Find messages containing the query
    for (const category in messageData) {
      const matchingMessages = messageData[category].filter((message) =>
        message.toLowerCase().includes(query.toLowerCase())
      );

      if (matchingMessages.length > 0) {
        matchingCategories.push({
          category: formatCategoryName(category),
          messages: matchingMessages,
        });
      }
    }
  }

  return matchingCategories;
}

/**
 * Populates the results container with matching categories and messages
 */
function populateMatchingResults(container, categories, query) {
  categories.forEach((item) => {
    let categoryHtml = `
      <div class="quickcopy-category-container">
        <div class="quickcopy-category">${item.category}</div>
    `;

    item.messages.forEach((message) => {
      let displayMessage = message;

      if (query) {
        // Highlight matching text
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escapedQuery})`, "gi");
        displayMessage = message.replace(
          regex,
          '<span class="quickcopy-highlight">$1</span>'
        );
      }

      categoryHtml += `
        <div class="quickcopy-message">
          ${displayMessage}
        </div>
      `;
    });

    categoryHtml += `</div>`;
    container.innerHTML += categoryHtml;
  });
}

/**
 * Attaches click handlers to message elements
 */
function attachMessageClickHandlers() {
  const messageElements = popupElement.querySelectorAll(".quickcopy-message");

  messageElements.forEach((element) => {
    element.addEventListener("click", function () {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = this.innerHTML;

      // Remove highlight spans to get clean text
      const highlights = tempDiv.querySelectorAll(".quickcopy-highlight");
      highlights.forEach((span) => {
        span.replaceWith(span.textContent);
      });

      const text = tempDiv.textContent.trim();
      copyToClipboard(text);
      hidePopup();
      showCopiedNotification(text);
    });
  });
}

/**
 * Displays the popup with message templates
 */
function showPopup(x, y, query) {
  if (!isExtensionValid()) {
    showErrorPopup("Extension was updated. Please refresh the page.");
    return;
  }

  executeSecurely(() => {
    chrome.storage.local.get("messageData", (result) => {
      if (chrome.runtime.lastError) {
        isExtensionActive = false;
        showErrorPopup("Extension error. Please refresh the page.");
        return;
      }

      if (!result.messageData) {
        popupElement.innerHTML = `
          <div class="quickcopy-empty">
            <p>No message templates found.</p>
            <p>Please configure QuickCopy in the extension options.</p>
          </div>
        `;
      } else {
        setupSearchInterface(result.messageData, query);
      }

      positionPopupCentered();
    });
  });
}

/**
 * Sets up the search interface in the popup
 */
function setupSearchInterface(messageData, initialQuery) {
  const searchBarHtml = `
    <div class="quickcopy-search-container">
      <input type="text" id="quickcopy-search" class="quickcopy-search" 
             value="${initialQuery}" placeholder="Search messages...">
      <button id="quickcopy-clear-search" class="quickcopy-clear-button">×</button>
    </div>
  `;

  popupElement.innerHTML = searchBarHtml;
  updateMessageResults(messageData, initialQuery);

  const searchInput = document.getElementById("quickcopy-search");
  const clearButton = document.getElementById("quickcopy-clear-search");

  setTimeout(() => {
    searchInput.focus();
    searchInput.selectionStart = searchInput.selectionEnd =
      searchInput.value.length;
  }, 100);

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hidePopup();
      e.preventDefault();
      return;
    }

    e.stopPropagation();
  });

  searchInput.addEventListener("input", function () {
    updateMessageResults(messageData, this.value.trim().toLowerCase());
  });

  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    updateMessageResults(messageData, "");
  });
}

// Event Listeners
document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString().trim().toLowerCase();
  if (selectedText && selectedText.length >= 3) {
    document.addEventListener("keydown", handleKeyDown);
  }
});

function handleKeyDown(e) {
  if (!isExtensionActive) return;

  if (e.key === "S" || e.key === "s") {
    const selectedText = window.getSelection().toString().trim().toLowerCase();
    if (selectedText && selectedText.length >= 3) {
      showPopup(e.clientX, e.clientY, selectedText);
    }
  }

  if (e.key === "Escape") {
    hidePopup();
  }
}

document.addEventListener("click", (e) => {
  if (
    popupElement.style.display === "block" &&
    !popupElement.contains(e.target)
  ) {
    hidePopup();
  }
});

// Extension message handling
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "extensionValid") {
    isExtensionActive = true;
  }
});

// Initialization
(function initialize() {
  try {
    chrome.runtime.getURL("");
  } catch (error) {
    console.error("Extension context invalid at startup");
    isExtensionActive = false;
  }
})();
