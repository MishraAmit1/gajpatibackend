import express from "express";
import {
  createProduct,
  deleteProduct,
  fetchProductsWithSearch,
  getAllProducts,
  getProductById,
  updateProduct,
  permanentDeleteProduct,
  getProductStats,
  toggleProductStatus,
} from "../controllers/product.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/allProducts", getAllProducts);
router.get("/stats", getProductStats);
router.get("/search", fetchProductsWithSearch);
router.get("/by-nature", fetchProductsWithSearch);
router.get("/:id", getProductById);
// Private routes
router.post(
  "/create",
  verifyJWT,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "brochure", maxCount: 1 },
    { name: "tds", maxCount: 1 },
  ]),
  createProduct
);
router.put(
  "/:id",
  verifyJWT,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "brochure", maxCount: 1 },
    { name: "tds", maxCount: 1 },
  ]),
  updateProduct
);
router.delete("/:id", verifyJWT, deleteProduct);
router.delete("/permanent/:id", verifyJWT, permanentDeleteProduct);
router.patch("/:id/toggle-status", verifyJWT, toggleProductStatus);
export default router;
