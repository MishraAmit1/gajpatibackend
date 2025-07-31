import express from "express";
import {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
} from "../controllers/inquires.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllInquiries);
router.get("/:id", getInquiryById);

// Private routes
router.post("/create", createInquiry);
router.put("/:id", verifyJWT, updateInquiry);
router.delete("/:id", verifyJWT, deleteInquiry);

export default router;
