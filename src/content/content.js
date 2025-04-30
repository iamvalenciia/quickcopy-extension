// Content script for QuickCopy extension

// Track selected text
let selectedText = "";

// Create popup element and style it
const popup = document.createElement("div");
popup.id = "quickcopy-popup";
document.body.appendChild(popup);

// Listen for text selection
document.addEventListener("mouseup", function (e) {
  selectedText = window.getSelection().toString().trim().toLowerCase();
});

// Listen for keyboard shortcut ('s' key)
document.addEventListener("keydown", function (e) {
  // Check if 's' was pressed and text is selected
  if (e.key === "s" && selectedText && selectedText.length >= 3) {
    // Get current mouse position
    const x = e.clientX;
    const y = e.clientY;

    // Show popup with matching messages
    showPopup(x, y, selectedText);
  }

  // Close popup on Escape key
  if (e.key === "Escape") {
    hidePopup();
  }
});

// Listen for clicks outside the popup to close it
document.addEventListener("click", function (e) {
  if (popup.style.display === "block" && !popup.contains(e.target)) {
    hidePopup();
  }
});

// Function to show popup with matching messages
// Function to show popup with matching messages
function showPopup(x, y, query) {
  // Get message data from storage
  chrome.storage.local.get("messageData", function (result) {
    if (!result.messageData) {
      popup.innerHTML = `
        <div class="quickcopy-empty">
          <p>No message templates found.</p>
          <p>Please configure QuickCopy in the extension options.</p>
        </div>
      `;
    } else {
      const messageData = result.messageData;

      // Create search bar
      const searchBarHtml = `
        <div class="quickcopy-search-container">
          <input type="text" id="quickcopy-search" class="quickcopy-search" 
                 value="${query}" placeholder="Search messages...">
          <button id="quickcopy-clear-search" class="quickcopy-clear-button">×</button>
        </div>
      `;

      // Initialize popup with search bar
      popup.innerHTML = searchBarHtml;

      // Populate messages
      updateMessageResults(messageData, query);

      // Add event listeners to search bar
      const searchInput = document.getElementById("quickcopy-search");
      const clearButton = document.getElementById("quickcopy-clear-search");

      // Focus on the input and select the text
      setTimeout(() => {
        searchInput.focus();
        searchInput.select();
      }, 100);

      // Prevent 's' key from triggering global shortcut when search is focused
      searchInput.addEventListener("keydown", function (e) {
        // Stop event propagation to prevent the global keydown listener from firing
        e.stopPropagation();
      });

      // Update results as user types
      searchInput.addEventListener("input", function () {
        const newQuery = this.value.trim().toLowerCase();
        updateMessageResults(messageData, newQuery);
      });

      // Clear search button
      clearButton.addEventListener("click", function () {
        searchInput.value = "";
        searchInput.focus();
        updateMessageResults(messageData, "");
      });
    }

    // Position popup in the center of the screen
    positionPopupCentered();

    // Add close button
    addCloseButton();
  });
}

// Function to update message results
function updateMessageResults(messageData, query) {
  let matchingMessages = [];
  const resultsContainer = document.createElement("div");
  resultsContainer.className = "quickcopy-results-container";

  // Remove any existing results container
  const existingResults = popup.querySelector(".quickcopy-results-container");
  if (existingResults) {
    popup.removeChild(existingResults);
  }

  // Ensure query is a string (prevents errors if undefined or null)
  query = query || "";

  // If query is empty, show all messages
  if (query === "") {
    for (const category in messageData) {
      matchingMessages.push({
        category: formatCategoryName(category),
        messages: messageData[category],
      });
    }
  } else {
    // Find matching messages for the query
    for (const category in messageData) {
      const messages = messageData[category];

      // Filter messages that contain the query
      const matches = messages.filter((message) =>
        message.toLowerCase().includes(query.toLowerCase())
      );

      if (matches.length > 0) {
        matchingMessages.push({
          category: formatCategoryName(category),
          messages: matches,
        });
      }
    }
  }

  // Populate results
  if (matchingMessages.length > 0) {
    matchingMessages.forEach((item) => {
      let categoryHtml = `
        <div class="quickcopy-category-container">
          <div class="quickcopy-category">${item.category}</div>
      `;

      item.messages.forEach((message) => {
        // Highlight the query in the message if it exists
        let highlightedMessage = message;
        if (query) {
          // Escape regex special characters
          const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Create regex for case-insensitive global search
          const regex = new RegExp(`(${escapedQuery})`, "gi");
          // Replace matches with highlighted version
          highlightedMessage = message.replace(
            regex,
            '<span class="quickcopy-highlight">$1</span>'
          );
        }

        categoryHtml += `
          <div class="quickcopy-message">
            ${highlightedMessage}
          </div>
        `;
      });

      categoryHtml += `</div>`;
      resultsContainer.innerHTML += categoryHtml;
    });
  } else {
    resultsContainer.innerHTML = `
      <div class="quickcopy-empty">
        <p>No matching messages found${query ? ` for "${query}"` : ""}.</p>
      </div>
    `;
  }

  // Add results to popup
  popup.appendChild(resultsContainer);

  // Add click event listeners to messages
  const messageElements = popup.querySelectorAll(".quickcopy-message");
  messageElements.forEach((el) => {
    el.addEventListener("click", function () {
      // Get text without the highlight spans
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = this.innerHTML;

      // Remove highlight spans and get plain text
      const highlights = tempDiv.querySelectorAll(".quickcopy-highlight");
      highlights.forEach((span) => {
        span.replaceWith(span.textContent);
      });

      const text = tempDiv.textContent.trim();
      copyToClipboard(text);
      hidePopup();

      // Show temporary copied notification
      showCopiedNotification(text);
    });
  });
}

// Function to update message results
function updateMessageResults(messageData, query) {
  let matchingMessages = [];
  const resultsContainer = document.createElement("div");
  resultsContainer.className = "quickcopy-results-container";

  // Remove any existing results container
  const existingResults = popup.querySelector(".quickcopy-results-container");
  if (existingResults) {
    popup.removeChild(existingResults);
  }

  // If query is empty, show all messages
  if (query === "") {
    for (const category in messageData) {
      matchingMessages.push({
        category: formatCategoryName(category),
        messages: messageData[category],
      });
    }
  } else {
    // Find matching messages for the query
    for (const category in messageData) {
      const messages = messageData[category];

      // Filter messages that contain the query
      const matches = messages.filter((message) =>
        message.toLowerCase().includes(query.toLowerCase())
      );

      if (matches.length > 0) {
        matchingMessages.push({
          category: formatCategoryName(category),
          messages: matches,
        });
      }
    }
  }

  // Populate results
  if (matchingMessages.length > 0) {
    matchingMessages.forEach((item) => {
      let categoryHtml = `
        <div class="quickcopy-category-container">
          <div class="quickcopy-category">${item.category}</div>
      `;

      item.messages.forEach((message) => {
        // Highlight the query in the message if it exists
        let highlightedMessage = message;
        if (query) {
          // Escape regex special characters
          const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Create regex for case-insensitive global search
          const regex = new RegExp(`(${escapedQuery})`, "gi");
          // Replace matches with highlighted version
          highlightedMessage = message.replace(
            regex,
            '<span class="quickcopy-highlight">$1</span>'
          );
        }

        categoryHtml += `
          <div class="quickcopy-message">
            ${highlightedMessage}
          </div>
        `;
      });

      categoryHtml += `</div>`;
      resultsContainer.innerHTML += categoryHtml;
    });
  } else {
    resultsContainer.innerHTML = `
      <div class="quickcopy-empty">
        <p>No matching messages found${query ? ` for "${query}"` : ""}.</p>
      </div>
    `;
  }

  // Add results to popup
  popup.appendChild(resultsContainer);

  // Add click event listeners to messages
  const messageElements = popup.querySelectorAll(".quickcopy-message");
  messageElements.forEach((el) => {
    el.addEventListener("click", function () {
      // Get text without the highlight spans
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = this.innerHTML;

      // Remove highlight spans and get plain text
      const highlights = tempDiv.querySelectorAll(".quickcopy-highlight");
      highlights.forEach((span) => {
        span.replaceWith(span.textContent);
      });

      const text = tempDiv.textContent.trim();
      copyToClipboard(text);
      hidePopup();

      // Show temporary copied notification
      showCopiedNotification(text);
    });
  });
}

// Function to position popup in center of screen
function positionPopupCentered() {
  // Show the popup to get its dimensions
  popup.style.display = "block";

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  const popupWidth = popup.offsetWidth;
  const popupHeight = popup.offsetHeight;

  // Calculate centered position
  const centeredX = Math.max(0, (viewportWidth - popupWidth) / 2);
  const centeredY = Math.max(0, (viewportHeight - popupHeight) / 2);

  // Apply centered position
  popup.style.left = centeredX + scrollX + "px";
  popup.style.top = centeredY + scrollY + "px";
}

// Function to hide popup
function hidePopup() {
  popup.style.display = "none";
}

// Function to copy text to clipboard - FIXED implementation with multiple methods
function copyToClipboard(text) {
  // Try using the Clipboard API first (most modern browsers)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard successfully!");
      })
      .catch((err) => {
        console.error("Failed to copy text with Clipboard API: ", err);
        // Fall back to other methods if Clipboard API fails
        fallbackCopyToClipboard(text);
      });
  } else {
    // If Clipboard API is not available, try other methods
    fallbackCopyToClipboard(text);

    // Also try the background script method as additional backup
    chrome.runtime.sendMessage({
      action: "copyToClipboard",
      text: text,
    });
  }
}

// Fallback method using execCommand (works in older browsers)
function fallbackCopyToClipboard(text) {
  try {
    // Create a temporary textarea element
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // Make the textarea not visible
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";

    // Add it to the document
    document.body.appendChild(textarea);

    // Select the text
    textarea.focus();
    textarea.select();

    // Execute the copy command
    const successful = document.execCommand("copy");

    if (successful) {
      console.log("Fallback clipboard copy successful");
    } else {
      console.error("Fallback clipboard copy failed");
    }

    // Remove the temporary element
    document.body.removeChild(textarea);
  } catch (err) {
    console.error("Error in fallback clipboard copy:", err);
  }
}

// Function to format category name
function formatCategoryName(category) {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Function to show a temporary "Copied!" notification
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

  // Remove the notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}
