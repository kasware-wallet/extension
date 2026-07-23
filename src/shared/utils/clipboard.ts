/**
 * Copy text to clipboard
 * Uses navigator.clipboard API if available and secure context,
 * otherwise falls back to execCommand method
 * @param textToCopy - The text or number to copy. Number type is supported for convenience
 *                     when copying numeric values like amounts or IDs without explicit toString()
 */
export const copyToClipboard = (textToCopy: string | number): Promise<void> => {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(textToCopy.toString());
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy.toString();
    textArea.style.position = 'absolute';
    textArea.style.opacity = '0';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise<void>((res, rej) => {
      if (document.execCommand('copy')) {
        res();
      } else {
        rej(new Error('Failed to copy text'));
      }
      textArea.remove();
    });
  }
};

/**
 * Clear clipboard content
 */
export const clearClipboard = async (): Promise<void> => {
  await copyToClipboard('');
};
