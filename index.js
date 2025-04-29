// Función para buscar mensajes
document.getElementById("searchInput").addEventListener("input", function (e) {
  const searchText = e.target.value.toLowerCase();

  // Filtrar mensajes regulares
  const regularMessages = document.querySelectorAll(
    "#regularMessages .message-item"
  );
  regularMessages.forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(searchText) ? "block" : "none";
  });

  // Filtrar mensajes on-hold
  const onHoldMessages = document.querySelectorAll(
    "#onHoldMessages .message-item"
  );
  onHoldMessages.forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(searchText) ? "block" : "none";
  });
});

// Función para copiar mensaje al hacer clic
document.querySelectorAll(".message-item").forEach((item) => {
  item.addEventListener("click", function () {
    const text = this.textContent;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Mostrar notificación
        const notification = document.createElement("div");
        notification.textContent = "✓ Copiado al portapapeles";
        notification.style.cssText = `
                     position: fixed;
                     bottom: 20px;
                     left: 50%;
                     transform: translateX(-50%);
                     background: #34a853;
                     color: white;
                     padding: 8px 16px;
                     border-radius: 4px;
                     z-index: 1000;
                     font-size: 12px;
                 `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      })
      .catch((err) => {
        console.error("Error al copiar: ", err);
      });
  });
});

// Toggle para el modo automático
document
  .getElementById("autoModeToggle")
  .addEventListener("change", function () {
    // Aquí se podría almacenar el estado en chrome.storage
    console.log("Modo automático: " + this.checked);
  });
