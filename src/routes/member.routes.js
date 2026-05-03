import express from "express";
import { createMember, listMembers, updateMember } from "../controllers/member.controller.js";

const router = express.Router();

console.log("📌 Member Routes Loaded");

router.post("/", createMember);
router.get("/", listMembers);
// router.get("/:id", getMemberById);
router.put("/:id", updateMember);
// router.delete("/:id", deleteMember);


export default router;
