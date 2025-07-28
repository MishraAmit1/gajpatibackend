import express from "express";
import {
  createPlant,
  deletePlant,
  fetchPlantswithSearch,
  getAllPlants,
  getPlantsById,
  updatePlant,
  permanentDeletePlant,
  getPlantStats,
  togglePlantStatus,
  getAllPlantsWithProducts,
} from "../controllers/plant.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/allPlants", getAllPlants);
router.get("/with-products", getAllPlantsWithProducts);
router.get("/stats", getPlantStats);
router.get("/search", verifyJWT, fetchPlantswithSearch);
router.get("/:id", getPlantsById);

// Pricate routes
router.post("/create", verifyJWT, createPlant);
router.put("/:id", verifyJWT, updatePlant);
router.delete("/:id", verifyJWT, deletePlant);
router.delete("/permanent/:id", verifyJWT, permanentDeletePlant);
router.patch("/:id/toggle-status", verifyJWT, togglePlantStatus);
export default router;
