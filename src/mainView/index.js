document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const jsonTextarea = document.getElementById("jsonText");
  const saveButton = document.getElementById("saveButton");
  const copyJsonButton = document.getElementById("copyJsonButton");
  const messagesContainer = document.getElementById("messagesContainer");
  const alertContainer = document.getElementById("alertContainer");
  const emptyState = messagesContainer?.querySelector(".empty-state");
  const categoriesSummary = messagesContainer?.querySelector(
    ".categories-summary"
  );
  const categoryGrid = messagesContainer?.querySelector(".category-grid");
  const totalElement = messagesContainer?.querySelector(".total-count");
  const totalMessagesElement =
    messagesContainer?.querySelector(".total-messages");
  const categoryDetail = messagesContainer?.querySelector(".category-detail");
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
  const deleteModal = document.getElementById("deleteModal");
  const confirmDeleteButton = document.getElementById("confirmDeleteButton");
  const cancelDeleteButton = document.getElementById("cancelDeleteButton");

  let jsonData = null;
  let currentCategory = null;
  let pendingDelete = { category: null, index: null };

  loadStoredData();

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
      // If edit tab, reload JSON data
      else if (tabId === "edit") {
        loadStoredData();
      }
    });
  });

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

  saveButton.addEventListener("click", () => {
    if (jsonData) {
      chrome.storage.local.set({ messageData: jsonData }, function () {
        if (chrome.runtime.lastError) {
          showNotification(chrome.runtime.lastError.message, "error");
        } else {
          showNotification("Configuration saved!", "success");
          loadStoredData();
        }
      });
    }
  });

  copyJsonButton.addEventListener("click", () => {
    if (jsonData) {
      const jsonString = JSON.stringify(jsonData, null, 2);
      navigator.clipboard
        .writeText(jsonString)
        .then(() => {
          showNotification("JSON copied to clipboard", "success");
        })
        .catch((err) => {
          showNotification(err.message, "error");
        });
    } else {
      showNotification("No JSON data to copy", "error");
    }
  });

  if (addCategoryButton) {
    addCategoryButton.addEventListener("click", () => {
      if (categoryNameInput) categoryNameInput.value = "";
      if (categoryModal) categoryModal.style.display = "flex";
    });
  }

  if (addMessageButton) {
    addMessageButton.addEventListener("click", () => {
      if (messageTextInput) messageTextInput.value = "";
      if (messageModal) messageModal.style.display = "flex";
    });
  }

  if (saveCategoryButton) {
    saveCategoryButton.addEventListener("click", saveCategory);
  }

  if (saveMessageButton) {
    saveMessageButton.addEventListener("click", saveMessage);
  }

  if (cancelCategoryButton) {
    cancelCategoryButton.addEventListener("click", () => {
      if (categoryModal) categoryModal.style.display = "none";
    });
  }

  if (cancelMessageButton) {
    cancelMessageButton.addEventListener("click", () => {
      if (messageModal) messageModal.style.display = "none";
    });
  }

  if (backButton) {
    backButton.addEventListener("click", backToCategories);
  }

  if (closeButtons) {
    closeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (categoryModal) categoryModal.style.display = "none";
        if (messageModal) messageModal.style.display = "none";
        if (deleteModal) deleteModal.style.display = "none";
      });
    });
  }

  if (confirmDeleteButton) {
    confirmDeleteButton.addEventListener("click", () => {
      if (pendingDelete.category !== null) {
        if (pendingDelete.index !== null) {
          // Delete single message
          const messageToDelete =
            jsonData[pendingDelete.category][pendingDelete.index];
          jsonData[pendingDelete.category].splice(pendingDelete.index, 1);
          saveData();
          displayCategoryMessages(pendingDelete.category);
          showNotification(
            `Message deleted: "${messageToDelete.substring(0, 50)}${
              messageToDelete.length > 50 ? "..." : ""
            }"`,
            "success"
          );
        } else {
          // Delete entire category (cascade delete)
          const categoryToDelete = pendingDelete.category;
          delete jsonData[pendingDelete.category];
          saveData();
          displayStoredMessages();
          showNotification(
            `Category "${formatCategoryName(categoryToDelete)}" deleted`,
            "success"
          );
        }
      }
      if (deleteModal) deleteModal.style.display = "none";
      pendingDelete = { category: null, index: null };
    });
  }

  if (cancelDeleteButton) {
    cancelDeleteButton.addEventListener("click", () => {
      if (deleteModal) deleteModal.style.display = "none";
      pendingDelete = { category: null, index: null };
    });
  }

  // Function to load stored data
  function loadStoredData() {
    chrome.storage.local.get("messageData", function (result) {
      if (chrome.runtime.lastError) {
        showNotification(chrome.runtime.lastError.message, "error");
        return;
      }

      if (result && result.messageData) {
        jsonData = result.messageData;
        // Always set the textarea value with formatted JSON
        jsonTextarea.value = JSON.stringify(jsonData, null, 2);
        saveButton.disabled = false;

        displayStoredMessages();
      } else {
        // If no data exists, initialize with empty object
        jsonData = {};
        jsonTextarea.value = JSON.stringify(jsonData, null, 2);
        saveButton.disabled = false;
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
        <div class="category-card-header">
          <div class="category-name">${formatCategoryName(category)}</div>
          <div class="message-count">${messages.length} message${
        messages.length !== 1 ? "s" : ""
      }</div>
        </div>
        <div class="category-messages-actions">
          <button class="edit-category" data-category="${category}" title="Edit category">
            <i class="fas fa-pen-to-square"></i>
          </button>
          <button class="delete-category" data-category="${category}" title="Delete category">
            <i class="fas fa-trash-can"></i>
          </button>
        </div>
      `;

      categoryCard.addEventListener("click", (e) => {
        // Don't trigger category view if clicking on action buttons
        if (!e.target.closest(".category-actions")) {
          displayCategoryMessages(category);
        }
      });

      // Add event listeners for category actions
      const editButton = categoryCard.querySelector(".edit-category");
      const deleteButton = categoryCard.querySelector(".delete-category");

      if (editButton) {
        editButton.addEventListener("click", (e) => {
          e.stopPropagation();
          const categoryToEdit = e.target.closest("button").dataset.category;
          categoryNameInput.value = categoryToEdit;
          categoryModal.style.display = "flex";

          // Remove any existing click handlers
          const newSaveButton = saveCategoryButton.cloneNode(true);
          saveCategoryButton.parentNode.replaceChild(
            newSaveButton,
            saveCategoryButton
          );

          // Add new click handler for editing
          newSaveButton.addEventListener("click", () => {
            const newCategoryName = categoryNameInput.value.trim();
            if (!newCategoryName) {
              showNotification("Please enter a category name", "error");
              return;
            }

            if (
              newCategoryName !== categoryToEdit &&
              jsonData[newCategoryName]
            ) {
              showNotification("Category name already exists", "error");
              return;
            }

            // Update category name
            const messages = jsonData[categoryToEdit];
            delete jsonData[categoryToEdit];
            jsonData[newCategoryName] = messages;

            saveData();
            categoryModal.style.display = "none";
            displayStoredMessages();
          });
        });
      }

      if (deleteButton) {
        deleteButton.addEventListener("click", (e) => {
          e.stopPropagation();
          const categoryToDelete = e.target.closest("button").dataset.category;
          pendingDelete = { category: categoryToDelete, index: null };
          deleteModal.querySelector(
            ".modal-body p"
          ).textContent = `Are you sure you want to delete the category "${formatCategoryName(
            categoryToDelete
          )}" and all its messages?`;
          deleteModal.style.display = "flex";
        });
      }

      categoryGrid.appendChild(categoryCard);
    }

    if (totalElement) {
      totalElement.textContent = Object.keys(jsonData).length;
    }
    if (totalMessagesElement) {
      totalMessagesElement.textContent = totalMessages;
    }
  }

  /**
   * Displays messages for a specific category and sets up related event listeners
   *
   * @function displayCategoryMessages
   * @param {string} category - The category key to display messages from
   * @returns {void}
   *
   * @description
   * This function handles the UI transition from category summary view to detailed category view.
   * It populates the message list for the selected category, updates count information, and
   * sets up event handlers for searching, editing, and deleting messages within the category.
   *
   * The function performs the following operations:
   * - Validates required DOM elements and data are available
   * - Updates the UI to show category details instead of summary
   * - Populates message list with formatted content
   * - Sets up search functionality for filtering messages
   * - Configures event listeners for message editing and deletion
   *
   * @example
   * // Display messages for the "greetings" category
   * displayCategoryMessages("greetings");
   *
   * @requires
   * - Global variables: categoryDetail, categoriesSummary, jsonData, currentCategory
   * - DOM elements: .category-name, .message-count, .messages-list, .category-search
   * - Functions: formatCategoryName, saveData, showNotification
   */
  function displayCategoryMessages(category) {
    if (
      !categoryDetail ||
      !categoriesSummary ||
      !jsonData ||
      !jsonData[category]
    )
      return;

    currentCategory = category;
    categoriesSummary.style.display = "none";
    categoryDetail.style.display = "block";

    const categoryName = categoryDetail.querySelector(".category-name");
    const messageCount = categoryDetail.querySelector(".message-count");
    const messagesList = categoryDetail.querySelector(".messages-list");
    const searchInput = categoryDetail.querySelector(".category-search");

    if (!categoryName || !messageCount || !messagesList || !searchInput) return;

    categoryName.textContent = formatCategoryName(category);
    messageCount.textContent = `${jsonData[category].length} message${
      jsonData[category].length !== 1 ? "s" : ""
    }`;

    searchInput.value = "";

    function renderMessages(filterQuery = "") {
      messagesList.innerHTML = "";
      const messages = jsonData[category] || [];
      const filteredMessages = filterQuery
        ? messages.filter((message) =>
            message.toLowerCase().includes(filterQuery.toLowerCase())
          )
        : messages;

      filteredMessages.forEach((message, filteredIndex) => {
        const originalIndex = messages.indexOf(message);

        const messageItem = document.createElement("div");
        messageItem.className = "message-item";
        messageItem.innerHTML = `
          <div class="message-text">${message}</div>
          <div class="category-messages-actions">
            <button class="edit-message" data-index="${originalIndex}" title="Edit message">
              <i class="fas fa-pen-to-square"></i>
            </button>
            <button class="delete-message" data-index="${originalIndex}" title="Delete message">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        `;
        messagesList.appendChild(messageItem);
      });

      messageCount.textContent = `${filteredMessages.length} message${
        filteredMessages.length !== 1 ? "s" : ""
      }`;

      messagesList.querySelectorAll(".edit-message").forEach((button) => {
        button.addEventListener("click", (e) => {
          const index = parseInt(e.target.closest("button").dataset.index);
          const originalMessage = jsonData[category][index];
          if (messageTextInput) messageTextInput.value = originalMessage;
          if (messageModal) messageModal.style.display = "flex";

          if (saveMessageButton && saveMessageButton.parentNode) {
            const newSaveButton = saveMessageButton.cloneNode(true);
            saveMessageButton.parentNode.replaceChild(
              newSaveButton,
              saveMessageButton
            );

            newSaveButton.addEventListener("click", () => {
              const newMessage = messageTextInput.value.trim();
              if (!newMessage) {
                showNotification("Please enter a message", "error");
                return;
              }

              jsonData[category][index] = newMessage;
              saveData();
              if (messageModal) messageModal.style.display = "none";
              displayCategoryMessages(category);
            });
          }
        });
      });

      messagesList.querySelectorAll(".delete-message").forEach((button) => {
        button.addEventListener("click", (e) => {
          const index = parseInt(e.target.closest("button").dataset.index);
          const messageToDelete = jsonData[category][index];
          pendingDelete = { category, index };
          const deleteModalBody = deleteModal.querySelector(".modal-body p");
          deleteModalBody.innerHTML = `Are you sure you want to delete this message?<br><br><strong>Preview:</strong><br><em>${messageToDelete.substring(
            0,
            100
          )}${messageToDelete.length > 100 ? "..." : ""}</em>`;
          if (deleteModal) deleteModal.style.display = "flex";
        });
      });
    }

    renderMessages();

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
    if (categoryModal) categoryModal.style.display = "none";
    displayStoredMessages();
  }

  // Function to save a new message
  function saveMessage() {
    const messageText = messageTextInput.value.trim();
    if (!messageText) {
      showNotification("Please enter a message", "error");
      return;
    }

    if (!currentCategory || !jsonData || !jsonData[currentCategory]) {
      showNotification("No category selected", "error");
      return;
    }

    if (!messageModal.dataset.editMode) {
      jsonData[currentCategory].push(messageText);
      saveData();
      if (messageModal) messageModal.style.display = "none";
      displayCategoryMessages(currentCategory);
    }
  }

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
    const displayText =
      text.length > 100 ? text.substring(0, 100) + "..." : text;

    // Set appropriate prefix
    let prefix = "";
    if (text.toLowerCase().startsWith("copy")) prefix = "Copied";

    // Set content
    alertElement.textContent = prefix
      ? `${prefix}: ${displayText}`
      : displayText;

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

  /**
   * Validates that a JSON object has the correct structure for the message data
   * @param {Object} data - The JSON data to validate
   * @returns {boolean} True if valid, false otherwise
   */
  function validateJsonStructure(data) {
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      return false;
    }

    for (const key in data) {
      if (!Array.isArray(data[key])) {
        return false;
      }

      if (data[key].some((item) => typeof item !== "string")) {
        return false;
      }
    }

    return true;
  }

  /**
   * Formats a category name from hyphenated lowercase to Title Case with spaces
   * @param {string} category - The category name to format
   * @returns {string} The formatted category name
   */
  function formatCategoryName(category) {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Saves data to chrome.storage.local
   * @param {Object} jsonData - The data to save
   * @param {Function} callback - Optional callback function
   */
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
