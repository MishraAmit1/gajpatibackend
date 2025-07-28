import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
} from "../controllers/blog.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.get("/slug/:slug", getBlogBySlug);

// Private routes
router.post(
  "/create",
  verifyJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  createBlog
);
router.put(
  "/:id",
  verifyJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateBlog
);
router.delete("/:id", verifyJWT, deleteBlog);

export default router;
