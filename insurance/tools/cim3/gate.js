const form = document.querySelector("#unlock-form");
const accountInput = document.querySelector("#account-name");
const approvalInput = document.querySelector("#approval-code");
const status = document.querySelector("#gate-status");
const stage = document.querySelector("#tool-stage");
const frame = document.querySelector("#tool-frame");
const lockButton = document.querySelector("#lock-tool");
const submitButton = form.querySelector("button[type='submit']");

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const payloadMagic = encoder.encode("OUTIS2");

function fromBase64Url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function sameBytes(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function setStatus(message, isError = false, isApproved = false) {
  status.textContent = message;
  status.classList.toggle("is-error", isError);
  status.classList.toggle("is-approved", isApproved);
}

async function verifyApproval(account, token) {
  const parts = token.trim().split(".");
  if (parts.length !== 2) throw new Error("approval-invalid");

  const payloadBytes = fromBase64Url(parts[0]);
  const signature = fromBase64Url(parts[1]);
  const approval = JSON.parse(decoder.decode(payloadBytes));
  if (approval.v !== 1 || approval.tool !== "cim3" || approval.account !== account) {
    throw new Error("approval-invalid");
  }

  const configResponse = await fetch("./config.json", { cache: "no-store" });
  if (!configResponse.ok) throw new Error("tool-unavailable");
  const config = await configResponse.json();
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    config.publicKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    signature,
    payloadBytes,
  );
  if (!valid) throw new Error("approval-invalid");

  const contentKey = fromBase64Url(approval.key);
  if (contentKey.length !== 32) throw new Error("approval-invalid");
  return contentKey;
}

async function decryptTool(contentKey) {
  const response = await fetch("./payload.bin", { cache: "no-store" });
  if (!response.ok) throw new Error("tool-unavailable");
  const payload = new Uint8Array(await response.arrayBuffer());
  const headerLength = payloadMagic.length + 12;
  if (payload.length <= headerLength || !sameBytes(payload.slice(0, payloadMagic.length), payloadMagic)) {
    throw new Error("tool-unavailable");
  }

  const key = await crypto.subtle.importKey("raw", contentKey, { name: "AES-GCM" }, false, ["decrypt"]);
  const iv = payload.slice(payloadMagic.length, headerLength);
  const ciphertext = payload.slice(headerLength);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  const html = decoder.decode(plaintext);
  if (!html.includes("<title>CIM3 费率查询器</title>")) throw new Error("tool-unavailable");
  return html;
}

function lockTool() {
  frame.removeAttribute("src");
  frame.srcdoc = "";
  stage.hidden = true;
  document.body.classList.remove("is-unlocked");
  document.querySelector("#access-panel").hidden = false;
  form.reset();
  setStatus("工具已锁定。请输入对应的账号和口令。");
  accountInput.focus();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const account = accountInput.value.trim();
  const approvalCode = approvalInput.value.trim();
  if (!account || !approvalCode) return;

  submitButton.disabled = true;
  accountInput.disabled = true;
  approvalInput.disabled = true;
  setStatus("正在验证账号与口令…");

  try {
    const contentKey = await verifyApproval(account, approvalCode);
    const html = await decryptTool(contentKey);
    setStatus("approved", false, true);
    frame.srcdoc = html;
    document.querySelector("#access-panel").hidden = true;
    stage.hidden = false;
    document.body.classList.add("is-unlocked");
    approvalInput.value = "";
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "tool-unavailable";
    setStatus(unavailable ? "工具文件暂时不可用，请稍后再试。" : "未获批准：账号或口令不匹配。", true);
    approvalInput.select();
  } finally {
    submitButton.disabled = false;
    accountInput.disabled = false;
    approvalInput.disabled = false;
  }
});

lockButton.addEventListener("click", lockTool);
