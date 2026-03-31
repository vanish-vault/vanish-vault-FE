/**
 * Copy text to clipboard with fallback support
 * Tries modern Clipboard API first, falls back to execCommand
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback method", err);
    }
  }

  // Fallback to execCommand method
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Make the textarea invisible
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    return successful;
  } catch (err) {
    console.error("Fallback copy method failed", err);
    return false;
  }
}
