const form = document.querySelector("#approval-form");
const accountInput = document.querySelector("#account-name");
const passphraseInput = document.querySelector("#owner-passphrase");
const status = document.querySelector("#approval-status");
const result = document.querySelector("#approval-result");
const approvalOutput = document.querySelector("#approval-code");
const copyButton = document.querySelector("#copy-approval");
const submitButton = form.querySelector("button[type='submit']");

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const vaultMagic = encoder.encode("OUTV1");

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
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

async function openVault(passphrase) {
  const response = await fetch("../cim3/vault.bin", { cache: "no-store" });
  if (!response.ok) throw new Error("vault-unavailable");
  const vault = new Uint8Array(await response.arrayBuffer());
  const headerLength = vaultMagic.length + 4 + 16 + 12;
  if (vault.length <= headerLength || !sameBytes(vault.slice(0, vaultMagic.length), vaultMagic)) {
    throw new Error("vault-unavailable");
  }

  const view = new DataView(vault.buffer, vault.byteOffset, vault.byteLength);
  const rounds = view.getUint32(vaultMagic.length, false);
  const saltStart = vaultMagic.length + 4;
  const salt = vault.slice(saltStart, saltStart + 16);
  const iv = vault.slice(saltStart + 16, headerLength);
  const ciphertext = vault.slice(headerLength);
  const material = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: rounds },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return JSON.parse(decoder.decode(plaintext));
}

async function createApproval(account, passphrase) {
  const vault = await openVault(passphrase);
  if (vault.v !== 1 || !vault.privateKey || !vault.contentKey) throw new Error("vault-unavailable");
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    vault.privateKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const payload = {
    v: 1,
    tool: "cim3",
    account,
    key: vault.contentKey,
  };
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, payloadBytes),
  );
  return `${toBase64Url(payloadBytes)}.${toBase64Url(signature)}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const account = accountInput.value.trim();
  const passphrase = passphraseInput.value;
  if (account.length < 2 || account.length > 80 || /[\u0000-\u001f\u007f]/u.test(account)) {
    setStatus("账号需为 2–80 个字符，且不能包含控制字符。", true);
    return;
  }

  submitButton.disabled = true;
  accountInput.disabled = true;
  passphraseInput.disabled = true;
  result.hidden = true;
  setStatus("正在生成账号口令…");

  try {
    approvalOutput.value = await createApproval(account, passphrase);
    result.hidden = false;
    setStatus("approved · 账号口令已生成", false, true);
    passphraseInput.value = "";
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "vault-unavailable";
    setStatus(unavailable ? "批准配置暂时不可用。" : "管理员口令不正确，无法生成账号口令。", true);
    passphraseInput.select();
  } finally {
    submitButton.disabled = false;
    accountInput.disabled = false;
    passphraseInput.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(approvalOutput.value);
    setStatus("approved · 账号口令已复制", false, true);
  } catch {
    approvalOutput.select();
    setStatus("已选中账号口令，请手动复制。", true);
  }
});
