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
function showPopup(x, y, query) {
  // Get message data from storage
  chrome.storage.local.get("messageData", function (result) {
    if (!result.messageData) {
      popup.innerHTML = `
        <div style="padding: 10px; text-align: center;">
          <p>No message templates found.</p>
          <p>Please configure QuickCopy in the extension options.</p>
        </div>
      `;
    } else {
      const messageData = result.messageData;
      let matchingMessages = [];

      // Find matching messages
      for (const category in messageData) {
        const messages = messageData[category];

        // Filter messages that contain the query
        const matches = messages.filter((message) =>
          message.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
          matchingMessages.push({
            category: formatCategoryName(category),
            messages: matches,
          });
        }
      }

      // Populate popup
      if (matchingMessages.length > 0) {
        let html = `<div style="margin-bottom: 8px; font-weight: bold;">Messages for "${query}":</div>`;

        matchingMessages.forEach((item) => {
          html += `<div style="margin-bottom: 8px;">
            <div style="font-weight: 500; color: #4a6da7; margin-bottom: 4px;">${item.category}</div>
          `;

          item.messages.forEach((message) => {
            html += `
              <div class="quickcopy-message" style="padding: 6px; margin-bottom: 4px; border: 1px solid #eee; border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                ${message}
              </div>
            `;
          });

          html += `</div>`;
        });

        popup.innerHTML = html;

        // Add click event listeners to messages
        const messageElements = popup.querySelectorAll(".quickcopy-message");
        messageElements.forEach((el) => {
          el.addEventListener("mouseover", function () {
            this.style.background = "#f5f5f5";
          });

          el.addEventListener("mouseout", function () {
            this.style.background = "white";
          });

          el.addEventListener("click", function () {
            const text = this.textContent.trim();
            copyToClipboard(text);
            hidePopup();

            // Show temporary copied notification
            showCopiedNotification(text);
          });
        });
      } else {
        popup.innerHTML = `
          <div style="padding: 10px; text-align: center;">
            <p>No matching messages found for "${query}".</p>
          </div>
        `;
      }
    }

    // Position and show popup
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    popup.style.left = x + scrollX + "px";
    popup.style.top = y + scrollY + "px";
    popup.style.display = "block";

    // Reposition if popup goes out of viewport
    const rect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth) {
      popup.style.left = viewportWidth - rect.width - 10 + scrollX + "px";
    }

    if (rect.bottom > viewportHeight) {
      popup.style.top = viewportHeight - rect.height - 10 + scrollY + "px";
    }
  });
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
