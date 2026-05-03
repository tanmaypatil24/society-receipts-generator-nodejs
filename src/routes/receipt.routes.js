import express from "express";
import {
  createReceiptHandler,
  getReceiptHandler,
  listReceiptsHandler,
  updateReceiptHandler,
} from "../controllers/receipt.controller.js";

const router = express.Router();

// Create receipt
router.post("/", createReceiptHandler);

// List receipts
router.get("/", listReceiptsHandler);

// Get single receipt by id
router.get("/:id", getReceiptHandler);

// Update receipt (full/partial)
router.put("/:id", updateReceiptHandler);

export default router;
