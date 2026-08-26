const toolName = document.body.dataset.tool;
const frame = document.querySelector("#tool-frame");
const loading = document.querySelector("#loading");
const lockButton = document.querySelector("#lock-tool");

async function loadTool() {
  try {
    const key = await window.OutisseusAccess.getSessionKey();
    frame.srcdoc = await window.OutisseusAccess.decryptTool(toolName, key);
    frame.hidden = false;
    loading.hidden = true;
  } catch {
    window.OutisseusAccess.clearSession();
    window.location.replace("../");
  }
}

lockButton.addEventListener("click", () => {
  frame.srcdoc = "";
  window.OutisseusAccess.clearSession();
  window.location.replace("../");
});

loadTool();
