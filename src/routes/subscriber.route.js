import express from "express";
import {
  getSubscribers,
  createSubscriber, // Import the createSubscriber function
  deleteSubscriber,
} from "../controllers/subscriber.controller.js";

const router = express.Router();

router.get("/subscribers", getSubscribers);
router.post("/subscribers", createSubscriber); // Add POST route for subscribing
router.delete("/subscribers/:id", deleteSubscriber);

export default router;
