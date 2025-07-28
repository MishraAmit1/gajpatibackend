import express from "express";
import {
  getPlantNatureProductStats,
  getPlantsWithStats,
} from "../controllers/plantStats.controller.js";

const router = express.Router();

// Protected route: only admin can access
router.get("/plant-nature-products", getPlantNatureProductStats);

// Public route: for homepage cards
router.get("/plants-with-stats", getPlantsWithStats);

export default router;
