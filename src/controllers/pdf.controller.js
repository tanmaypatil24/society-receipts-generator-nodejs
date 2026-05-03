import { getReceiptByIdService, listReceiptsService } from "../services/receipt.service.js";

import {
  generateSingleReceiptPdfBuffer,
  generateReceiptsPdfBuffer,
  generateReceiptCopiesPdfBuffer,
} from "../services/pdf.service.js";

export async function previewSingleReceiptHandler(req, res) {
  try {
    // accept both JSON and form posts
    const receiptId = req.body.receiptId || req.body.id;
    if (!receiptId)
      return res.status(400).json({ error: "receiptId required" });

    const r = await getReceiptByIdService(receiptId);
    if (!r) return res.status(404).json({ error: "Receipt not found" });

    const pdf = await generateSingleReceiptPdfBuffer(r);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.send(pdf);
  } catch (err) {
    console.error("Preview Single PDF error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function downloadSingleReceiptHandler(req, res) {
  try {
    const receiptId = req.body.receiptId || req.body.id;
    if (!receiptId)
      return res.status(400).json({ error: "receiptId required" });

    const r = await getReceiptByIdService(receiptId);
    if (!r) return res.status(404).json({ error: "Receipt not found" });

    const pdf = await generateSingleReceiptPdfBuffer(r);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt_${r.receipt_no}.pdf`
    );
    res.send(pdf);
  } catch (err) {
    console.error("Download Single PDF error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function mergePdfHandler(req, res) {
  try {
    let ids = req.body.receiptIds || req.body.ids;

    if (!ids) {
      return res.status(400).json({ error: "receiptIds missing" });
    }

    // If incoming is JSON string → parse to array
    if (typeof ids === "string") {
      try {
        ids = JSON.parse(ids);
      } catch {
        ids = ids.split(",").map((s) => s.trim());
      }
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "receiptIds array required" });
    }

    console.log("Parsed receiptIds:", ids);

    const receipts = [];
    for (const id of ids) {
      const r = await getReceiptByIdService(id);
      if (r) receipts.push(r);
    }
    if (receipts.length === 0)
      return res.status(404).json({ error: "No receipts found" });

    const pdf = await generateReceiptsPdfBuffer(receipts);
    const download = !!req.body.download;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      download
        ? `attachment; filename=merged_receipts_${Date.now()}.pdf`
        : "inline"
    );
    res.send(pdf);
  } catch (err) {
    console.error("Merge PDF error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function previewCopies(req, res) {
  try {
    let receipts = req.body.receipts;
    let ids = req.body.receiptIds || req.body.ids;

    // Option A: Full receipt objects sent
    if (Array.isArray(receipts)) {
      if (receipts.length === 0)
        return res.status(400).json({ error: "Receipts array empty" });
    }
    // Option B: Only IDs sent → fetch from DB
    else if (ids) {
      if (typeof ids === "string") ids = JSON.parse(ids);
      receipts = [];
      for (const id of ids) {
        const r = await getReceiptByIdService(id);
        if (r) receipts.push(r);
      }
    } else {
      return res.status(400).json({ error: "receiptIds or receipts required" });
    }

    const pdfBuffer = await generateReceiptCopiesPdfBuffer(receipts);
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", "inline");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Preview Copies Error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function downloadCopies(req, res) {
  try {
    let receipts = req.body.receipts;
    let ids = req.body.receiptIds || req.body.ids;

    if (Array.isArray(receipts)) {
      if (!receipts.length)
        return res.status(400).json({ error: "Receipts array empty" });
    } else if (ids) {
      if (typeof ids === "string") ids = JSON.parse(ids);
      receipts = [];
      for (const id of ids) {
        const r = await getReceiptByIdService(id);
        if (r) receipts.push(r);
      }
    } else {
      return res.status(400).json({ error: "receiptIds or receipts required" });
    }

    const pdfBuffer = await generateReceiptCopiesPdfBuffer(receipts);
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", 'attachment; filename="receipt_copies.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Download Copies Error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function printAllReceipts(req, res) {
  try {
    // 1. Fetch all receipts from your DB (replace service with yours)
    const receipts = await listReceiptsService();
console.log(receipts);
    if (!receipts || receipts.length === 0) {
      return res.status(404).json({ error: "No receipts found in database" });
    }

    // 2. Generate PDF (ORIGINAL + COPY for every receipt)
    const pdfBuffer = await generateReceiptCopiesPdfBuffer(receipts);

    // 3. Send PDF inline (preview)
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", "inline; filename=all_receipts.pdf");
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Print All Receipts Error:", err);
    res.status(500).json({ error: "Failed to generate all receipts PDF" });
  }
}
