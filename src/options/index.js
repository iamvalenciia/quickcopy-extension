document.addEventListener("DOMContentLoaded", function () {
  // DOM element references
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const jsonTextarea = document.getElementById("jsonText");
  const jsonPreview = document.getElementById("jsonPreview");
  const saveButton = document.getElementById("saveButton");
  const resetButton = document.getElementById("resetButton");
  const loadTemplateButton = document.getElementById("loadTemplateButton");
  const alertContainer = document.getElementById("alertContainer");
  const messagesContainer = document.getElementById("messagesContainer");

  // Global variables
  let jsonData = null;

  // Initialize - load stored data
  loadStoredData();

  // Tab switching logic - add passive: true to improve performance
  tabs.forEach((tab) => {
    tab.addEventListener(
      "click",
      () => {
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
      },
      { passive: true }
    );
  });

  // JSON textarea event listener - must be non-passive as we need to process input thoroughly
  jsonTextarea.addEventListener("input", () => {
    try {
      const jsonText = jsonTextarea.value.trim();

      if (!jsonText) {
        jsonPreview.textContent = "No data to display";
        saveButton.disabled = true;
        return;
      }

      jsonData = JSON.parse(jsonText);

      // Validate JSON structure
      if (!validateJsonStructure(jsonData)) {
        showAlert(
          "JSON has incorrect structure. Please check the Help section for correct format.",
          "danger"
        );
        saveButton.disabled = true;
        return;
      }

      // Show preview
      jsonPreview.textContent = JSON.stringify(jsonData, null, 2);
      saveButton.disabled = false;
      showAlert(
        'Valid JSON. Click "Save Configuration" to apply changes.',
        "success"
      );
    } catch (error) {
      showAlert("Error parsing JSON: " + error.message, "danger");
      jsonPreview.textContent = "No data to display";
      saveButton.disabled = true;
    }
  });

  // Load template button - add passive: true to improve performance
  loadTemplateButton.addEventListener(
    "click",
    () => {
      const templateJson = {
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
        category5: ["Example message for category 5."],
        category6: ["Example message for category 6."],
      };

      jsonTextarea.value = JSON.stringify(templateJson, null, 2);
      // Manually trigger the input event
      const event = new Event("input", { bubbles: true });
      jsonTextarea.dispatchEvent(event);
    },
    { passive: true }
  );

  // Save configuration button - add passive: true to improve performance
  saveButton.addEventListener(
    "click",
    () => {
      if (jsonData) {
        chrome.storage.local.set({ messageData: jsonData }, function () {
          if (chrome.runtime.lastError) {
            showAlert(
              "Error saving configuration: " + chrome.runtime.lastError.message,
              "danger"
            );
          } else {
            showAlert("Configuration saved successfully!", "success");
            loadStoredData();
          }
        });
      }
    },
    { passive: true }
  );

  // Reset button - add passive: true to improve performance
  resetButton.addEventListener(
    "click",
    () => {
      jsonTextarea.value = "";
      jsonPreview.textContent = "No data to display";
      saveButton.disabled = true;
    },
    { passive: true }
  );

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
  function showAlert(message, type) {
    alertContainer.innerHTML = `
        <div class="alert alert-${type}">
          ${message}
        </div>
      `;

    // Hide alert after 5 seconds
    setTimeout(() => {
      alertContainer.innerHTML = "";
    }, 1000);
  }

  // Function to load stored data
  function loadStoredData() {
    chrome.storage.local.get("messageData", function (result) {
      if (chrome.runtime.lastError) {
        showAlert(
          "Error loading data: " + chrome.runtime.lastError.message,
          "danger"
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
          jsonPreview.textContent = JSON.stringify(jsonData, null, 2);
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
      messagesContainer.innerHTML = `
          <p class="text-center">No saved messages.</p>
          <p class="text-center">Go to the "Edit JSON" tab to configure your messages.</p>
        `;
      return;
    }

    let html = "";

    // Create accordion for each category
    for (const category in jsonData) {
      const messages = jsonData[category];
      if (messages.length === 0) continue;

      const categoryId = category.replace(/[^a-z0-9]/gi, "");

      html += `
          <div class="category-section">
            <h3>${formatCategoryName(category)} <span class="badge">${
        messages.length
      }</span></h3>
            <div class="messages-list">
        `;

      // List messages
      messages.forEach((message, index) => {
        html += `
            <div class="message-item" data-category="${category}" data-index="${index}">
              ${message}
            </div>
          `;
      });

      html += `
            </div>
          </div>
        `;
    }

    if (html === "") {
      html = `<p class="text-center">No messages in any category.</p>`;
    }

    messagesContainer.innerHTML = html;

    // Add click event listeners to messages - with passive options for better performance
    document.querySelectorAll(".message-item").forEach((item) => {
      item.addEventListener(
        "click",
        function () {
          const text = this.textContent.trim();
          navigator.clipboard
            .writeText(text)
            .then(() => {
              showAlert("Message copied to clipboard!", "success");
            })
            .catch((err) => {
              showAlert("Failed to copy: " + err, "danger");
            });
        },
        { passive: true }
      );
    });
  }

  // Function to format category name
  function formatCategoryName(category) {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
});
