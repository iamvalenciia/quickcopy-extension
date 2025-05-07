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
  const categoryDetail = messagesContainer.querySelector(".category-detail");
  const addCategoryButton = document.getElementById("addCategoryButton");
  const addMessageButton = document.getElementById("addMessageButton");
  const categoryModal = document.getElementById("categoryModal");
  const messageModal = document.getElementById("messageModal");
  const categoryNameInput = document.getElementById("categoryName");
  const messageTextInput = document.getElementById("messageText");
  const saveCategoryButton = document.getElementById("saveCategoryButton");
  const saveMessageButton = document.getElementById("saveMessageButton");
  const cancelCategoryButton = document.getElementById("cancelCategoryButton");
  const cancelMessageButton = document.getElementById("cancelMessageButton");
  const closeButtons = document.querySelectorAll(".close-button");
  const backButton = document.querySelector(".back-button");

  // Global variables
  let jsonData = null;
  let currentCategory = null;

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

  // Event Listeners
  addCategoryButton.addEventListener("click", () => {
    categoryNameInput.value = "";
    categoryModal.style.display = "flex";
  });

  addMessageButton.addEventListener("click", () => {
    messageTextInput.value = "";
    messageModal.style.display = "flex";
  });

  saveCategoryButton.addEventListener("click", saveCategory);
  saveMessageButton.addEventListener("click", saveMessage);
  cancelCategoryButton.addEventListener("click", () => categoryModal.style.display = "none");
  cancelMessageButton.addEventListener("click", () => messageModal.style.display = "none");
  backButton.addEventListener("click", backToCategories);

  closeButtons.forEach(button => {
    button.addEventListener("click", () => {
      categoryModal.style.display = "none";
      messageModal.style.display = "none";
    });
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

  // Function to display stored messages
  function displayStoredMessages() {
    if (!jsonData || Object.keys(jsonData).length === 0) {
      emptyState.style.display = "block";
      categoriesSummary.style.display = "none";
      categoryDetail.style.display = "none";
      return;
    }

    emptyState.style.display = "none";
    categoriesSummary.style.display = "block";
    categoryDetail.style.display = "none";

    categoryGrid.innerHTML = "";
    let totalMessages = 0;

    for (const category in jsonData) {
      const messages = jsonData[category];
      totalMessages += messages.length;

      const categoryCard = document.createElement("div");
      categoryCard.className = "category-card";
      categoryCard.setAttribute("data-category", category);
      categoryCard.innerHTML = `
        <div class="category-name">${formatCategoryName(category)}</div>
        <div class="message-count">${messages.length} message${messages.length !== 1 ? "s" : ""}</div>
      `;

      categoryCard.addEventListener("click", () => displayCategoryMessages(category));
      categoryGrid.appendChild(categoryCard);
    }

    totalElement.textContent = Object.keys(jsonData).length;
    totalMessagesElement.textContent = totalMessages;
  }

  // Function to format category name
  function formatCategoryName(category) {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Function to display category messages
  function displayCategoryMessages(category) {
    currentCategory = category;
    categoriesSummary.style.display = "none";
    categoryDetail.style.display = "block";

    const categoryName = categoryDetail.querySelector(".category-name");
    const messageCount = categoryDetail.querySelector(".message-count");
    const messagesList = categoryDetail.querySelector(".messages-list");
    const searchInput = categoryDetail.querySelector(".category-search");

    categoryName.textContent = formatCategoryName(category);
    messageCount.textContent = `${jsonData[category].length} message${jsonData[category].length !== 1 ? "s" : ""}`;

    // Clear previous search
    searchInput.value = "";

    // Function to render messages with optional filtering
    function renderMessages(filterQuery = "") {
      messagesList.innerHTML = "";
      const messages = jsonData[category];
      const filteredMessages = filterQuery
        ? messages.filter(message => message.toLowerCase().includes(filterQuery.toLowerCase()))
        : messages;

      filteredMessages.forEach((message, index) => {
        const messageItem = document.createElement("div");
        messageItem.className = "message-item";
        messageItem.innerHTML = `
          <div class="message-text">${message}</div>
          <div class="message-actions">
            <button class="edit-message" data-index="${index}" title="Edit message">
              <i class="fas fa-pen-to-square"></i>
            </button>
            <button class="delete-message" data-index="${index}" title="Delete message">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        `;
        messagesList.appendChild(messageItem);
      });

      // Update message count to show filtered count
      messageCount.textContent = `${filteredMessages.length} message${filteredMessages.length !== 1 ? "s" : ""}`;

      // Add event listeners for message actions
      messagesList.querySelectorAll(".edit-message").forEach(button => {
        button.addEventListener("click", (e) => {
          const index = parseInt(e.target.closest("button").dataset.index);
          const originalMessage = jsonData[category][index];
          messageTextInput.value = originalMessage;
          messageModal.style.display = "flex";
          
          // Remove any existing click handlers
          const newSaveButton = saveMessageButton.cloneNode(true);
          saveMessageButton.parentNode.replaceChild(newSaveButton, saveMessageButton);
          
          // Add new click handler
          newSaveButton.addEventListener("click", () => {
            const newMessage = messageTextInput.value.trim();
            if (!newMessage) {
              showNotification("Please enter a message", "error");
              return;
            }
            
            // Update the message at the specific index
            jsonData[category][index] = newMessage;
            saveData();
            messageModal.style.display = "none";
            displayCategoryMessages(category);
          });
        });
      });

      messagesList.querySelectorAll(".delete-message").forEach(button => {
        button.addEventListener("click", (e) => {
          const index = parseInt(e.target.closest("button").dataset.index);
          if (confirm("Are you sure you want to delete this message?")) {
            jsonData[category].splice(index, 1);
            saveData();
            displayCategoryMessages(category);
          }
        });
      });
    }

    // Initial render
    renderMessages();

    // Add search input event listener
    searchInput.addEventListener("input", (e) => {
      renderMessages(e.target.value);
    });
  }

  // Function to go back to categories view
  function backToCategories() {
    currentCategory = null;
    categoryDetail.style.display = "none";
    categoriesSummary.style.display = "block";
    displayStoredMessages();
  }

  // Function to save a new category
  function saveCategory() {
    const categoryName = categoryNameInput.value.trim();
    if (!categoryName) {
      showNotification("Please enter a category name", "error");
      return;
    }

    if (!jsonData) {
      jsonData = {};
    }

    if (jsonData[categoryName]) {
      showNotification("Category already exists", "error");
      return;
    }

    jsonData[categoryName] = [];
    saveData();
    categoryModal.style.display = "none";
    displayStoredMessages();
  }

  // Function to save a new message
  function saveMessage() {
    const messageText = messageTextInput.value.trim();
    if (!messageText) {
      showNotification("Please enter a message", "error");
      return;
    }

    if (!currentCategory) {
      showNotification("No category selected", "error");
      return;
    }

    // Only add new message if we're not in edit mode
    if (!messageModal.dataset.editMode) {
      jsonData[currentCategory].push(messageText);
      saveData();
      messageModal.style.display = "none";
      displayCategoryMessages(currentCategory);
    }
  }

  // Function to save data to storage
  function saveData() {
    chrome.storage.local.set({ messageData: jsonData }, function () {
      if (chrome.runtime.lastError) {
        showNotification(chrome.runtime.lastError.message, "error");
      } else {
        showNotification("Changes saved", "success");
      }
    });
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
