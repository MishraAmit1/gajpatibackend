import express from "express";
import {
  createNature,
  deleteNature,
  fetchNaturesWithSearch,
  getAllNatures,
  getNatureById,
  updateNature,
  permanentDeleteNature,
  getNatureStats,
  toggleNatureStatus,
} from "../controllers/nature.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/allNatures", getAllNatures);
router.patch("/:id/toggle-status", verifyJWT, toggleNatureStatus);
router.get("/stats", getNatureStats);
router.get("/search", fetchNaturesWithSearch);
router.get("/:id", getNatureById);

// Private routes
router.post(
  "/create",
  verifyJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  createNature
);
router.put(
  "/:id",
  verifyJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateNature
);
router.delete("/:id", verifyJWT, deleteNature);
router.delete("/permanent/:id", verifyJWT, permanentDeleteNature);

export default router;
