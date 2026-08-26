const lockButton = document.querySelector("#lock-toolkit");

async function openList() {
  try {
    await window.OutisseusAccess.getSessionKey();
    document.body.classList.remove("session-pending");
  } catch {
    window.OutisseusAccess.clearSession();
    window.location.replace("../");
  }
}

lockButton.addEventListener("click", () => {
  window.OutisseusAccess.clearSession();
  window.location.replace("../");
});

openList();
