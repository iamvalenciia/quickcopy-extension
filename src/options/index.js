document.addEventListener("DOMContentLoaded", function () {
  // DOM element references
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const jsonTextarea = document.getElementById("jsonText");
  const saveButton = document.getElementById("saveButton");
  const copyJsonButton = document.getElementById("copyJsonButton");
  const messagesContainer = document.getElementById("messagesContainer");
  const alertContainer = document.getElementById("alertContainer");
  const emptyState = messagesContainer.querySelector(".empty-state");
  const categoriesSummary = messagesContainer.querySelector(".categories-summary");
  const categoryGrid = messagesContainer.querySelector(".category-grid");
  const totalElement = messagesContainer.querySelector(".total-count");
  const totalMessagesElement = messagesContainer.querySelector(".total-messages");

  // Global variables
  let jsonData = null;

  // Initialize - load stored data
  loadStoredData();

  // Tab switching logic
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and contents
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Add active class to current tab and content
      tab.classList.add("active");
      const tabId = tab.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");

      // If view tab, display stored messages
      if (tabId === "view") {
        displayStoredMessages();
      }
    });
  });

  // JSON textarea event listener
  jsonTextarea.addEventListener("input", () => {
    try {
      const jsonText = jsonTextarea.value.trim();
      jsonData = JSON.parse(jsonText);

      // Validate JSON structure
      if (!validateJsonStructure(jsonData)) {
        showNotification(
          "JSON has incorrect structure. Please check the Help section for correct format.",
          "error"
        );
        saveButton.disabled = true;
        return;
      }
    } catch (error) {
      showNotification("Error parsing JSON: " + error.message, "error");
      saveButton.disabled = true;
    }
  });

  // Save configuration button
  saveButton.addEventListener("click", () => {
    if (jsonData) {
      chrome.storage.local.set({ messageData: jsonData }, function () {
        if (chrome.runtime.lastError) {
          showNotification(
            chrome.runtime.lastError.message,
            "error"
          );
        } else {
          showNotification("Configuration saved!", "success");
          loadStoredData();
        }
      });
    }
  });

  // Copy JSON button
  copyJsonButton.addEventListener("click", () => {
    if (jsonData) {
      const jsonString = JSON.stringify(jsonData, null, 2);
      navigator.clipboard.writeText(jsonString)
        .then(() => {
          showNotification("JSON copied to clipboard", "success");
        })
        .catch(err => {
          showNotification(err.message, "error");
        });
    } else {
      showNotification("No JSON data to copy", "error");
    }
  });

  // Function to validate JSON structure
  function validateJsonStructure(data) {
    // Check if object exists and has at least one property
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      return false;
    }

    // Check that each property is an array
    for (const key in data) {
      if (!Array.isArray(data[key])) {
        return false;
      }

      // Check that each array element is a string
      if (data[key].some((item) => typeof item !== "string")) {
        return false;
      }
    }

    return true;
  }

  // Function to show alerts

  // Function to load stored data
  function loadStoredData() {
    chrome.storage.local.get("messageData", function (result) {
      if (chrome.runtime.lastError) {
        showNotification(
          chrome.runtime.lastError.message,
          "error"
        );
        return;
      }

      if (result && result.messageData) {
        jsonData = result.messageData;

        // Set textarea value if we're on the edit tab
        if (
          document
            .querySelector('.tab[data-tab="edit"]')
            .classList.contains("active")
        ) {
          jsonTextarea.value = JSON.stringify(jsonData, null, 2);
          saveButton.disabled = false;
        }

        // If we're on the view tab, display messages
        if (
          document
            .querySelector('.tab[data-tab="view"]')
            .classList.contains("active")
        ) {
          displayStoredMessages();
        }
      }
    });
  }

  // Function to display stored messages (only categories with message counts)
  function displayStoredMessages() {
    if (!jsonData || Object.keys(jsonData).length === 0) {
      // Show empty state
      emptyState.style.display = "block";
      categoriesSummary.style.display = "none";
      return;
    }

    // Hide empty state, show categories summary
    emptyState.style.display = "none";
    categoriesSummary.style.display = "block";

    // Clear existing category cards
    categoryGrid.innerHTML = "";

    // Get total message count
    let totalMessages = 0;
    for (const category in jsonData) {
      totalMessages += jsonData[category].length;
    }

    // Create category cards
    for (const category in jsonData) {
      const messages = jsonData[category];
      if (messages.length === 0) continue;

      const categoryId = category.replace(/[^a-z0-9]/gi, "");
      const formattedName = formatCategoryName(category);

      // Create category card element
      const categoryCard = document.createElement("div");
      categoryCard.className = "category-card";
      categoryCard.setAttribute("data-category", category);

      // Set inner HTML of category card
      categoryCard.innerHTML = `
        <div class="category-header">
          <h3 class="category-name">${formattedName}</h3>
          <span class="message-count">${messages.length} message${
        messages.length !== 1 ? "s" : ""
      }</span>
        </div>
      `;

      // Add click event listener directly to the card
      categoryCard.addEventListener(
        "click",
        function () {
          displayCategoryMessages(category);
        },
        { passive: true }
      );

      // Add to grid
      categoryGrid.appendChild(categoryCard);
    }

    // Update total count
    totalElement.textContent = `${Object.keys(jsonData).length}`;

    totalMessagesElement.textContent = `${totalMessages}`;
  }

  // Function to format category name
  function formatCategoryName(category) {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
});

/**
 * Shows a temporary notification on the screen
 * @param {string} text - The text to display in the notification
 * @param {string} type - The notification type ('default', 'success', 'error')
 * @param {number} duration - Duration in milliseconds the notification will show (optional, default: 3000ms)
 */
function showNotification(text, type = "default", duration = 2000) {
  // Get the alert container element
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) {
    console.error("Alert container element not found!");
    return null;
  }

  // Create a new alert element
  const alertElement = document.createElement("div");

  // Set the class based on type
  alertElement.className = "alert";

  if (type === "success") {
    alertElement.classList.add("alert-success");
  } else if (type === "error") {
    alertElement.classList.add("alert-danger");
  } else {
    alertElement.classList.add("alert-default");
  }

  // Truncate text if too long
  const displayText = text.length > 100 ? text.substring(0, 100) + "..." : text;

  // Set appropriate prefix
  let prefix = "";
  if (text.toLowerCase().startsWith("copy")) prefix = "Copied";

  // Set content
  alertElement.textContent = prefix ? `${prefix}: ${displayText}` : displayText;

  // Add to container
  alertContainer.appendChild(alertElement);

  // Remove after the specified duration
  setTimeout(() => {
    alertElement.classList.add("alert-fade-out");
    setTimeout(() => {
      if (alertElement.parentNode) {
        alertContainer.removeChild(alertElement);
      }
    }, 300);
  }, duration);

  return alertElement;
}
