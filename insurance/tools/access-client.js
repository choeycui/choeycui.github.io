(function () {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const payloadMagic = encoder.encode("OUTIS2");
  const sessionName = "outisseus-adviser-toolkit-session-v1";
  const tools = {
    cim3: { file: "/insurance/tools/payloads/cim3.bin", needle: "<title>CIM3 费率查询器</title>" },
    promo: { file: "/insurance/tools/payloads/promo.bin", needle: "<title>2026 年 4 月优惠计算器</title>" },
  };

  function fromBase64Url(value) {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  }

  function sameBytes(left, right) {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return false;
    }
    return true;
  }

  async function verifyApproval(account, passcode) {
    const parts = passcode.trim().split(".");
    if (parts.length !== 2) throw new Error("approval-invalid");
    const payloadBytes = fromBase64Url(parts[0]);
    const signature = fromBase64Url(parts[1]);
    const approval = JSON.parse(decoder.decode(payloadBytes));
    if (approval.v !== 1 || approval.tool !== "adviser-toolkit" || approval.account !== account) {
      throw new Error("approval-invalid");
    }

    const response = await fetch("/insurance/tools/access/config.json", { cache: "no-store" });
    if (!response.ok) throw new Error("tool-unavailable");
    const config = await response.json();
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
    const key = fromBase64Url(approval.key);
    if (key.length !== 32) throw new Error("approval-invalid");
    return key;
  }

  function saveSession(account, passcode) {
    sessionStorage.setItem(sessionName, JSON.stringify({ account, passcode }));
  }

  function clearSession() {
    sessionStorage.removeItem(sessionName);
  }

  async function getSessionKey() {
    const raw = sessionStorage.getItem(sessionName);
    if (!raw) throw new Error("session-missing");
    const session = JSON.parse(raw);
    return verifyApproval(session.account, session.passcode);
  }

  async function decryptTool(name, contentKey) {
    const definition = tools[name];
    if (!definition) throw new Error("tool-unavailable");
    const response = await fetch(definition.file, { cache: "no-store" });
    if (!response.ok) throw new Error("tool-unavailable");
    const payload = new Uint8Array(await response.arrayBuffer());
    const headerLength = payloadMagic.length + 12;
    if (payload.length <= headerLength || !sameBytes(payload.slice(0, payloadMagic.length), payloadMagic)) {
      throw new Error("tool-unavailable");
    }
    const key = await crypto.subtle.importKey("raw", contentKey, { name: "AES-GCM" }, false, ["decrypt"]);
    const iv = payload.slice(payloadMagic.length, headerLength);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, payload.slice(headerLength));
    const html = decoder.decode(plaintext);
    if (!html.includes(definition.needle)) throw new Error("tool-unavailable");
    return html;
  }

  window.OutisseusAccess = { clearSession, decryptTool, getSessionKey, saveSession, verifyApproval };
})();
