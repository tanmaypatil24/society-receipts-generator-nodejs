import express from "express";
import memberRoutes from "./routes/member.routes.js";
import receiptRoutes from "./routes/receipt.routes.js";
import pdfRoutes from "./routes/pdf.routes.js";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Basic health
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// API routes
app.use("/api/members", memberRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/pdf", pdfRoutes);


export default app;
