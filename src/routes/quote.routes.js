import express from "express";
import {
  createQuote,
  getAllQuotes,
  getQuoteById,
  updateQuote,
  deleteQuote,
} from "../controllers/quotes.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllQuotes);
router.get("/:id", getQuoteById);

// Private routes
router.post("/create", createQuote);
router.put("/:id", verifyJWT, updateQuote);
router.delete("/:id", verifyJWT, deleteQuote);

export default router;
