/**
 * Helper utilities for embedding and previewing PDF lectures and documents
 * safely inside the web app across all desktop and mobile browsers.
 */

export function getEmbeddableUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // 1. In-memory Blobs or base64 data URLs: directly renderable
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Google Drive preview links
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }

  const driveQueryMatch = trimmed.match(/drive\.google\.com\/(?:open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  if (driveQueryMatch && driveQueryMatch[1]) {
    return `https://drive.google.com/file/d/${driveQueryMatch[1]}/preview`;
  }

  // 3. GitHub and direct web PDF files:
  // GitHub raw (raw.githubusercontent.com) serves files with 'Content-Disposition: attachment'
  // and 'X-Frame-Options: deny', causing browsers to download the file automatically on iframe load
  // and refusing to render inside the iframe.
  // Google Docs Viewer embeds the PDF as an interactive web canvas/viewer without auto-downloading.
  let targetUrl = trimmed;
  if (targetUrl.includes('github.com') && targetUrl.includes('/blob/')) {
    targetUrl = targetUrl.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/');
  }

  try {
    // decodeURI first to avoid double-encoding existing percent sequences (e.g. Arabic file paths)
    const normalizedUrl = decodeURI(targetUrl);
    const encoded = encodeURIComponent(normalizedUrl);
    return `https://docs.google.com/viewer?embedded=true&url=${encoded}`;
  } catch {
    return `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(targetUrl)}`;
  }
}

export function getDownloadUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Google Drive direct export download
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveFileMatch[1]}`;
  }

  const driveQueryMatch = trimmed.match(/drive\.google\.com\/(?:open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  if (driveQueryMatch && driveQueryMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveQueryMatch[1]}`;
  }

  // Normalize GitHub blob to raw for direct download
  if (trimmed.includes('github.com') && trimmed.includes('/blob/')) {
    return trimmed.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/');
  }

  return trimmed;
}
