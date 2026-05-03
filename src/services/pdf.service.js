// src/services/pdf.service.js
import puppeteer from "puppeteer";
import { receiptTemplateOriginal } from "./html/receipt.original.template.js";
import { receiptTemplateWithCopy } from "./html/receipt.copy.template.js";

function buildMultipageHtml(receipts) {
  // group receipts two-per-page
  const pages = [];
  for (let i = 0; i < receipts.length; i += 2) {
    const left = receipts[i];
    const right = receipts[i + 1] || null;
    const leftHtml = receiptTemplateOriginal(left);
    const rightHtml = right ? receiptTemplateOriginal(right) : "";
    // We will stack top and bottom (each occupies half A4 height).
    // To match your original layout which is full-width across, we'll render one receipt per half-page (top and bottom)
    const pageHtml = `
      <div class="a4page">
        <div class="half top">
          ${leftHtml}
        </div>
        <div class="cutline"></div>
        <div class="half bottom">
          ${rightHtml}
        </div>
      </div>
    `;
    pages.push(pageHtml);
  }

  const full = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
      rel="stylesheet"
    />
    <style>
      @page {
        size: A4;
        margin: 5mm;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: "Inter", Arial, sans-serif;
        -webkit-print-color-adjust: exact;
      }
      .a4page {
        width: 100%;
        height: 287mm;
        box-sizing: border-box;
        page-break-after: always;
        position: relative;
      }
      .half {
        height: calc(50% - 6mm);
        box-sizing: border-box;
      }
      .cutline {
        border-top: 1px dashed #777;
        box-sizing: border-box;
        margin: 20px auto;
      }
      /* Template-internal styles (mirrors receipt.template.js) */
      .receipt-root {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .paper {
        position: relative;
        z-index: 2;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 4px solid #000;
        padding: 15px;
      }
      .header {
        text-align: center;
        margin-bottom: 6px;
      }
      .header .title {
        font-weight: 800;
        font-size: 24px;
        font-family: math;
        letter-spacing: 2.2px;
      }
      .header .reg,
      .header .addr {
        font-size: 14px;
        margin-top: 4px;
      }
      .receipt-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 10px 0;
        font-size: 24px;
        font-weight: 800;
      }

      .receipt-badge span {
        padding: 0 10px;
        border: 2px solid black; /* boxed RECEIPT */
      }

      .receipt-badge::before,
      .receipt-badge::after {
        content: "";
        flex: 1;
        border-bottom: 2px solid black; /* side horizontal lines */
      }
      .receipt-badge::before {
        margin-right: 10px;
      }
      .receipt-badge::after {
        margin-left: 10px;
      }

      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: 10px 0;
      }
      .label {
        min-width: 30px;
        font-size: 14px;
        font-weight: 700;
      }
      .label.wide {
        min-width: 190px;
      }
      .line {
        border-bottom: 2px dashed #b4b4b4;
        flex: 1;
        padding: 5px;
        min-height: 15px;
        font-size: 14px;
        color: #000;
      }
      .short {
        width: 140px;
      }
      .short-rupees {
        width: 140px;
      }
      .fill {
        flex: 1;
      }
      .muted {
        font-weight: 700;
        font-size: 14px;
      }
      .top-row .spacer {
        flex: 1;
      }
      .amount-row {
        display: flex;
        gap: 0px;
        align-items: center;
        flex-wrap: wrap;
      }
      .amount-area {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }
      .rupee-box {
        width: 40px;
        height: 40px;
        border: 2px solid #111;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5px;
        font-size: 28px;
        font-weight: 700;
      }
      .amount-box {
        flex: 1;
        width: 200px;
        border: 2px solid #111;
        padding: 5px 10px;
        height: 40px;
        display: flex;
        align-items: center;
        font-size: 28px;
        font-weight: 700;
      }
      .footer {
        display: flex;
        width: 50%;
        flex-direction: column;
        align-items: end;
        font-size: 14px;
      }
      .signs {
        display: flex;
        width: 350px;
        justify-content: space-between;
        font-weight: 700;
        align-items: center;
        margin-top: 10px;
      }
      .for-company {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 45px;
        letter-spacing: 1.5px;
      }

      .sig {
        width: 30%;
        text-align: center;
        border-top: 1px solid #000;
        padding-top: 5px;
      }

      .note {
        font-size: 12px;
        margin-top: 5px;
      }
    </style>
  </head>
  <body>
    ${pages.join("\n")}
  </body>
  </html>
  `;
  return full;
}
  
/** Generate PDF buffer for array of receipts */
export async function generateReceiptsPdfBuffer(receipts = []) {
  if (!Array.isArray(receipts) || receipts.length === 0)
    throw new Error("No receipts provided");

  const html = buildMultipageHtml(receipts);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

/** single receipt helper */
export async function generateSingleReceiptPdfBuffer(receipt) {
  return generateReceiptsPdfBuffer([receipt]);
}

function buildCopiesHtml(receipts = []) {
  const pages = receipts.map(
    (r) => `
    <div class="a4page">
      <div class="half top">
        ${receiptTemplateOriginal(r)}
      </div>

      <div class="cutline"></div>

      <div class="half bottom">
        ${receiptTemplateWithCopy(r, "RECEIVER COPY")}
      </div>
    </div>
  `
  );

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
      rel="stylesheet"
    />
    <style>
      @page {
        size: A4;
        margin: 5mm;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: "Inter", Arial, sans-serif;
        -webkit-print-color-adjust: exact;
      }
    .copy-tag{
        font-size:12px;
    }
      .a4page {
        width: 100%;
        height: 287mm;
        box-sizing: border-box;
        page-break-after: always;
        position: relative;
      }
      .half {
        height: calc(50% - 6mm);
        box-sizing: border-box;
      }
      .cutline {
        border-top: 1px dashed #777;
        box-sizing: border-box;
        margin: 20px auto;
      }
      /* Template-internal styles (mirrors receipt.template.js) */
      .receipt-root {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .paper {
        position: relative;
        z-index: 2;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 4px solid #000;
        padding: 15px;
      }
      .header {
        text-align: center;
        margin-bottom: 6px;
      }
      .header .title {
        font-weight: 800;
        font-size: 24px;
        font-family: math;
        letter-spacing: 2.2px;
      }
      .header .reg,
      .header .addr {
        font-size: 14px;
        margin-top: 4px;
      }
      .receipt-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 10px 0;
        font-size: 24px;
        font-weight: 800;
      }

      .receipt-badge span {
        padding: 0 10px;
        border: 2px solid black; /* boxed RECEIPT */
      }

      .receipt-badge::before,
      .receipt-badge::after {
        content: "";
        flex: 1;
        border-bottom: 2px solid black; /* side horizontal lines */
      }
      .receipt-badge::before {
        margin-right: 10px;
      }
      .receipt-badge::after {
        margin-left: 10px;
      }

      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: 10px 0;
      }
      .label {
        min-width: 30px;
        font-size: 14px;
        font-weight: 700;
      }
      .label.wide {
        min-width: 190px;
      }
      .line {
        border-bottom: 2px dashed #b4b4b4;
        flex: 1;
        padding: 5px;
        min-height: 15px;
        font-size: 14px;
        color: #000;
      }
      .short {
        width: 140px;
      }
      .short-rupees {
        width: 140px;
      }
      .fill {
        flex: 1;
      }
      .muted {
        font-weight: 700;
        font-size: 14px;
      }
      .top-row .spacer {
        flex: 1;
      }
      .amount-row {
        display: flex;
        gap: 0px;
        align-items: center;
        flex-wrap: wrap;
      }
      .amount-area {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }
      .rupee-box {
        width: 40px;
        height: 40px;
        border: 2px solid #111;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5px;
        font-size: 28px;
        font-weight: 700;
      }
      .amount-box {
        flex: 1;
        width: 200px;
        border: 2px solid #111;
        padding: 5px 10px;
        height: 40px;
        display: flex;
        align-items: center;
        font-size: 28px;
        font-weight: 700;
      }
      .footer {
        display: flex;
        width: 50%;
        flex-direction: column;
        align-items: end;
        font-size: 14px;
      }
      .signs {
        display: flex;
        width: 350px;
        justify-content: space-between;
        font-weight: 700;
        align-items: center;
        margin-top: 10px;
      }
      .for-company {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 45px;
        letter-spacing: 1.5px;
      }

      .sig_bottom {
        width: 100%;
        text-align: center;
        border-top: 1px solid #000;
        padding-top: 5px;
      }

      .note {
        font-size: 12px;
        margin-top: 5px;
      }
    </style>
  </head>
  <body>
    ${pages.join("\n")}
  </body>
  </html>
  `;
}

export async function generateReceiptCopiesPdfBuffer(receipts = []) {
  if (!Array.isArray(receipts) || receipts.length === 0)
    throw new Error("No receipts provided");

  const html = buildCopiesHtml(receipts);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}
