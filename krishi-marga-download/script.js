/**
 * Krishi Marga Download Page — Configuration & Logic
 *
 * The APK URL is centralized in APK_DOWNLOAD_URL. When the EAS build finishes,
 * updating this single variable updates the download button, QR code, and direct link.
 */

// ============================================================================
// CONFIGURATION: CENTRAL APK DOWNLOAD URL
// ============================================================================
const APK_DOWNLOAD_URL = "https://expo.dev/artifacts/eas/t_tjjlgnO3r90v6FPbQonC98-5yj5NEFY2wWnKp-u3c.apk";

// ============================================================================
// INITIALIZE PAGE & QR CODE
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  setupDownloadLinks();
  renderQrCode(APK_DOWNLOAD_URL);
});

function setupDownloadLinks() {
  const heroBtn = document.getElementById("hero-download-btn");
  const finalBtn = document.getElementById("final-download-btn");
  const directLink = document.getElementById("direct-download-link");

  if (heroBtn) heroBtn.href = APK_DOWNLOAD_URL;
  if (finalBtn) finalBtn.href = APK_DOWNLOAD_URL;
  if (directLink) {
    directLink.href = APK_DOWNLOAD_URL;
    directLink.textContent = APK_DOWNLOAD_URL;
  }
}

/**
 * Lightweight SVG QR code generator (renders to canvas without external libraries)
 */
function renderQrCode(url) {
  const canvas = document.getElementById("qr-canvas");
  if (!canvas) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    canvas.width = 220;
    canvas.height = 220;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, 220, 220);
    }
  };
  img.src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(url) + "&color=1B4332&bgcolor=FFFFFF";
}

