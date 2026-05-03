import express from "express";

import {
  previewSingleReceiptHandler,
  downloadSingleReceiptHandler,
  mergePdfHandler,
  previewCopies,
  downloadCopies,
  printAllReceipts,
} from "../controllers/pdf.controller.js";

const router = express.Router();

router.post("/single/preview", previewSingleReceiptHandler);

router.post("/single/download", downloadSingleReceiptHandler);

router.post("/merge", mergePdfHandler);

router.post("/copies/preview", previewCopies);

router.post("/copies/download", downloadCopies);

console.log("PDF Routes Loaded");

router.post("/copies/all", printAllReceipts);



export default router;
