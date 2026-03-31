import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import * as UTIF from "utif";

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};

export const isPrintableFile = (file: FileAttachment): boolean => {
  return isPrintable(file.contentType);
};

interface FileAttachment {
  id: string;
  filename: string;
  fileSize: number;
  contentType: string;
  originalFilename: string;
  fileFullPath: string;
  status: string;
  path: string;
}

// ── Type guards ────────────────────────────────────────────────────────────

const isVideoType = (contentType: string) => contentType.startsWith("video/");

const isImageType = (contentType: string) => contentType.startsWith("image/");

const isTextType = (contentType: string) =>
  (contentType.startsWith("text/") && contentType !== "text/csv") ||
  contentType === "application/json";

const isWordType = (contentType: string) =>
  contentType === "application/msword" ||
  contentType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const isExcelType = (contentType: string) =>
  contentType === "application/vnd.ms-excel" ||
  contentType ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
  contentType === "text/csv";

const isPrintable = (contentType: string) =>
  !isVideoType(contentType) &&
  [
    "application/pdf",
    "image/",
    "application/json",
    "text/",
    "application/msword",
    "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-excel",
  ].some((t) => contentType.startsWith(t));

// ── Shared base styles injected into every iframe ─────────────────────────

const BASE_STYLES = `
  @page { margin: 0.2in; size: auto; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 0;
  }
`;

// ── Helper: create iframe, write HTML into it, trigger print ──────────────

const writeAndPrint = (
  bodyHtml: string,
  extraStyles = "",
  onReady?: (
    doc: Document,
    triggerPrint: () => void,
    cleanup: () => void,
  ) => void,
) => {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;pointer-events:none;";

  const cleanup = () => {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
    window.removeEventListener("focus", cleanup);
  };

  const triggerPrint = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.addEventListener("focus", cleanup);
    }, 100);
  };

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
    <html>
      <head>
        <style>
          ${BASE_STYLES}
          ${extraStyles}
        </style>
      </head>
      <body>${bodyHtml}</body>
    </html>`);
  doc.close();

  if (onReady) {
    onReady(doc, triggerPrint, cleanup);
  } else {
    triggerPrint();
  }
};

// ── Main export ────────────────────────────────────────────────────────────

export const handlePrint = async (file: {
  fileFullPath: string;
  contentType: string;
  originalFilename: string;
}): Promise<void> => {
  if (isVideoType(file.contentType)) return;
  if (!isPrintable(file.contentType)) return;

  const response = await fetch(file.fileFullPath);
  const blob = await response.blob();

  // ── Images ──────────────────────────────────────────────────────────────
  if (isImageType(file.contentType)) {
    let objectUrl: string;

    if (file.contentType === "image/tiff") {
      // Convert TIFF to PNG
      const arrayBuffer = await blob.arrayBuffer();
      const ifds = UTIF.decode(arrayBuffer);
      if (ifds.length === 0) throw new Error("Invalid TIFF file");
      const ifd = ifds[0];
      UTIF.decodeImage(arrayBuffer, ifd);
      const width = ifd.width;
      const height = ifd.height;
      const rgba = UTIF.toRGBA8(ifd);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(rgba);
      ctx.putImageData(imageData, 0, 0);

      const pngBlob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png"),
      );
      objectUrl = URL.createObjectURL(pngBlob);
    } else {
      objectUrl = URL.createObjectURL(blob);
    }

    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;pointer-events:none;";

    const cleanup = () => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      URL.revokeObjectURL(objectUrl);
      window.removeEventListener("focus", cleanup);
    };

    const triggerPrint = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        window.addEventListener("focus", cleanup);
      }, 100);
    };

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      cleanup();
      return;
    }

    doc.open();
    doc.write(`<!DOCTYPE html>
      <html>
        <head>
          <style>
            @page { margin: 0.2in; size: auto; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; }
            body { display: flex; justify-content: center; align-items: center; }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
              display: block;
            }
            @media print {
              body { margin: 0; }
              img { max-width: 100%; max-height: 100%; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body><img src="${objectUrl}" id="printImg" /></body>
      </html>`);
    doc.close();

    const img = doc.getElementById("printImg") as HTMLImageElement;
    if (img.complete) {
      triggerPrint();
    } else {
      img.onload = triggerPrint;
      img.onerror = cleanup;
    }
    return;
  }

  // ── Plain text / JSON ────────────────────────────────────────────────────
  if (isTextType(file.contentType)) {
    const text = await blob.text();
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    writeAndPrint(
      `<pre style="white-space:pre-wrap;word-break:break-all;font-family:monospace;font-size:12px;padding:24px;">${escaped}</pre>`,
    );
    return;
  }

  // ── Word (.doc / .docx) ──────────────────────────────────────────────────
  if (isWordType(file.contentType)) {
    const arrayBuffer = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });

    writeAndPrint(
      `<div class="word-content">${result.value}</div>`,
      `
        .word-content { padding: 0; }
        h1 { font-size: 20px; margin: 0.6em 0; }
        h2 { font-size: 17px; margin: 0.5em 0; }
        h3 { font-size: 14px; margin: 0.4em 0; }
        h4, h5, h6 { font-size: 12px; margin: 0.4em 0; font-weight: bold; }
        p { margin: 0.4em 0; }
        strong, b { font-weight: bold; }
        em, i { font-style: italic; }
        u { text-decoration: underline; }
        table { border-collapse: collapse; width: 100%; margin: 0.6em 0; }
        td, th { border: 1px solid #ccc; padding: 6px 8px; vertical-align: top; }
        th { background: #f0f0f0; font-weight: bold; }
        ul { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
        ol { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
        li { margin: 0.2em 0; }
        img { max-width: 100%; height: auto; }
        a { color: #1a0dab; }
        @media print {
          a { text-decoration: none; color: inherit; }
        }
      `,
    );
    return;
  }

  // ── Excel (.xls / .xlsx) / CSV ───────────────────────────────────────────
  if (isExcelType(file.contentType)) {
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const sheetsHtml = workbook.SheetNames.map((sheetName, index) => {
      const sheet = workbook.Sheets[sheetName];
      const html = XLSX.utils.sheet_to_html(sheet, { editable: false });
      const isLast = index === workbook.SheetNames.length - 1;
      return `
        <div class="sheet${isLast ? "" : " page-break"}">
          ${workbook.SheetNames.length > 1 ? `<h2 class="sheet-title">${sheetName}</h2>` : ""}
          ${html}
        </div>
      `;
    }).join("");

    writeAndPrint(
      sheetsHtml,
      `
        @page { margin: 0.5in; size: landscape; }
        .sheet { margin-bottom: 1em; }
        .sheet-title {
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 2px solid #333;
        }
        table { border-collapse: collapse; width: 100%; font-size: 11px; }
        td, th {
          border: 1px solid #ccc;
          padding: 4px 6px;
          text-align: left;
          vertical-align: top;
          white-space: nowrap;
        }
        tr:first-child td, th { background: #f0f0f0; font-weight: bold; }
        tr:nth-child(even) { background: #fafafa; }
        .page-break { page-break-after: always; }
        @media print {
          td, th { font-size: 10px; padding: 3px 4px; }
          @page { margin: 0.2in; size: landscape; }
        }
      `,
    );
    return;
  }

  // ── PDF — native browser renderer ────────────────────────────────────────
  const objectUrl = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;pointer-events:none;";

  const cleanup = () => {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
    URL.revokeObjectURL(objectUrl);
    window.removeEventListener("focus", cleanup);
  };

  iframe.src = objectUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.addEventListener("focus", cleanup);
    }, 100);
  };
};

export const handleDownload = async (file: FileAttachment) => {
  try {
    const response = await fetch(file.fileFullPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.originalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
  }
};
