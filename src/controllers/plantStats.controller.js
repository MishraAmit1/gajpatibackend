import { Plant } from "../models/plant.model.js";
import { Nature } from "../models/nature.model.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";

// GET /api/plant-nature-products
export const getPlantNatureProductStats = async (req, res) => {
  try {
    // Get all plants
    const plants = await Plant.find({ isActive: true });
    const plantIds = plants.map((p) => p._id);
    // Get all natures for these plants
    const natures = await Nature.find({
      plantId: { $in: plantIds },
      isActive: true,
    });
    const natureIds = natures.map((n) => n._id);
    // Get product counts grouped by natureId
    const productCounts = await Product.aggregate([
      { $match: { natureId: { $in: natureIds }, isActive: true } },
      { $group: { _id: "$natureId", count: { $sum: 1 } } },
    ]);
    // Map natureId to count
    const countMap = {};
    productCounts.forEach((pc) => {
      countMap[pc._id.toString()] = pc.count;
    });
    // Build result
    const result = [];
    natures.forEach((nature) => {
      const plant = plants.find((p) => p._id.equals(nature.plantId));
      result.push({
        plantId: plant._id,
        plantName: plant.name,
        natureId: nature._id,
        natureName: nature.name,
        productCount: countMap[nature._id.toString()] || 0,
      });
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/plants-with-stats - New endpoint for homepage cards
export const getPlantsWithStats = asyncHandler(async (req, res) => {
  try {
    // Get all active plants with their product counts and top 3 natures
    const plantsWithStats = await Plant.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "natures",
          localField: "_id",
          foreignField: "plantId",
          pipeline: [
            { $match: { isActive: true } },
            {
              $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "natureId",
                pipeline: [{ $match: { isActive: true } }],
                as: "products",
              },
            },
            {
              $addFields: {
                productCount: { $size: "$products" },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                productCount: 1,
              },
            },
            { $sort: { productCount: -1 } },
            { $limit: 3 },
          ],
          as: "topNatures",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "plantId",
          pipeline: [{ $match: { isActive: true } }],
          as: "allProducts",
        },
      },
      {
        $addFields: {
          totalProductCount: { $size: "$allProducts" },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          totalProductCount: 1,
          topNatures: 1,
        },
      },
    ]);

    return sendResponse(
      res,
      200,
      plantsWithStats,
      "Plants with stats fetched successfully"
    );
  } catch (error) {
    console.error("Error while fetching plants with stats:", error.message);
    throw new Error("Something went wrong while fetching plants with stats");
  }
});
