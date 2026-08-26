const form = document.querySelector("#unlock-form");
const accountInput = document.querySelector("#account-name");
const approvalInput = document.querySelector("#approval-code");
const status = document.querySelector("#gate-status");
const submitButton = form.querySelector("button[type='submit']");

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const account = accountInput.value.trim();
  const passcode = approvalInput.value.trim();
  if (!account || !passcode) return;

  submitButton.disabled = true;
  setStatus("正在验证账号与口令…");
  try {
    await window.OutisseusAccess.verifyApproval(account, passcode);
    window.OutisseusAccess.saveSession(account, passcode);
    setStatus("approved · 正在进入工具列表");
    window.location.assign("./list/");
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "tool-unavailable";
    setStatus(unavailable ? "工具配置暂时不可用，请稍后再试。" : "未获批准：账号或口令不匹配。", true);
    approvalInput.select();
  } finally {
    submitButton.disabled = false;
  }
});
