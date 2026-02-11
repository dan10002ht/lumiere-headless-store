import { getScriptUrl } from "joy-subscription-sdk/core";

const pendingLoads = new Map();

/**
 * Force reload an SDK scripttag by removing old <script> and adding new one.
 * Needed because SDK's internal loadedScripts Set prevents re-loading on SPA navigation.
 * Deduplicates concurrent requests (e.g., Widget + Bundle on same page).
 */
export function reloadScript(scriptKey) {
  if (pendingLoads.has(scriptKey)) {
    return pendingLoads.get(scriptKey);
  }

  const url = getScriptUrl(scriptKey);

  // Remove existing script tag so browser re-executes when re-added
  document.querySelectorAll(`script[src="${url}"]`).forEach((s) => s.remove());

  const promise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => {
      pendingLoads.delete(scriptKey);
      resolve();
    };
    script.onerror = () => {
      pendingLoads.delete(scriptKey);
      resolve();
    };
    document.head.appendChild(script);
  });

  pendingLoads.set(scriptKey, promise);
  return promise;
}

/**
 * Remove a script tag from DOM. Call on component cleanup.
 */
export function removeScript(scriptKey) {
  const url = getScriptUrl(scriptKey);
  document.querySelectorAll(`script[src="${url}"]`).forEach((s) => s.remove());
  pendingLoads.delete(scriptKey);
}
