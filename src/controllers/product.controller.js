import mongoose from "mongoose";
import { convertToArray } from "../helper/convertArray.js";
import { generateSlug } from "../helper/slug.js";
import { Product } from "../models/product.model.js";
import { Plant } from "../models/plant.model.js";
import { Nature } from "../models/nature.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadToSupabase, deleteFromSupabase } from "../utils/superbase.js";

export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    abbreviation,
    slug,
    natureId,
    plantId,
    description,
    shortDescription,
    seoTitle,
    seoDescription,
    seoKeywords,
    technicalSpecifications,
    plantAvailability,
    applications,
    status,
  } = req.body;
  if (
    !name ||
    !abbreviation ||
    !natureId ||
    !plantId ||
    !description ||
    !shortDescription ||
    !seoTitle ||
    !seoDescription ||
    !seoKeywords ||
    !technicalSpecifications ||
    !plantAvailability ||
    !applications ||
    !status
  ) {
    throw throwApiError(400, "All required fields must be provided");
  }
  // Validate natureId and plantId
  if (
    !mongoose.isValidObjectId(natureId) ||
    !mongoose.isValidObjectId(plantId)
  ) {
    throw throwApiError(400, "Invalid Nature ID or Plant ID format");
  }

  // Check if nature and plant exist and are active
  const nature = await Nature.findOne({ _id: natureId, isActive: true });
  if (!nature) {
    throw throwApiError(404, "Active Nature not found");
  }

  const plant = await Plant.findOne({ _id: plantId, isActive: true });
  if (!plant) {
    throw throwApiError(404, "Active Plant not found");
  }

  // Handle file uploads
  const imageFiles = req.files?.images || [];
  const brochureFile = req.files?.brochure?.[0];
  const tdsFile = req.files?.tds?.[0];

  if (imageFiles.length === 0) {
    throw throwApiError(400, "At least one image is required");
  }
  if (!brochureFile) {
    throw throwApiError(400, "Brochure file is required");
  }
  if (!tdsFile) {
    throw throwApiError(400, "TDS file is required");
  }

  // Upload files to Supabase with cleanup on failure
  const uploadedFiles = []; // Track uploaded files for cleanup
  try {
    const images = [];
    let primaryCount = 0;
    for (let i = 0; i < imageFiles.length; i++) {
      const uploadResult = await uploadToSupabase(imageFiles[i], "products");
      if (!uploadResult?.url) {
        throw throwApiError(500, "Failed to upload image to Supabase");
      }
      const isPrimary =
        req.body[`images[${i}].isPrimary`] === "true" ||
        (i === 0 && primaryCount === 0);
      if (isPrimary) primaryCount++;
      images.push({
        url: uploadResult.url,
        alt: req.body[`images[${i}].alt`] || `Product image ${i + 1}`,
        isPrimary,
      });
      uploadedFiles.push({ url: uploadResult.url, type: "products" });
    }
    if (primaryCount !== 1) {
      throw throwApiError(400, "Exactly one image must be marked as primary");
    }

    const brochureUpload = await uploadToSupabase(brochureFile, "products");
    if (!brochureUpload?.url) {
      throw throwApiError(500, "Failed to upload brochure to Supabase");
    }
    uploadedFiles.push({ url: brochureUpload.url, type: "products" });

    const tdsUpload = await uploadToSupabase(tdsFile, "products");
    if (!tdsUpload?.url) {
      throw throwApiError(500, "Failed to upload TDS to Supabase");
    }
    uploadedFiles.push({ url: tdsUpload.url, type: "products" });

    // Generate slug if not provided
    const productSlug = slug || generateSlug(name);

    // Check if product already exists
    const existingProduct = await Product.findOne({
      $or: [{ name: name.toLowerCase() }, { slug: productSlug }],
    });
    if (existingProduct) {
      throw throwApiError(409, "Product with this name or slug already exists");
    }

    // Validate and format arrays
    const seoKeywordsArray = convertToArray(seoKeywords);
    if (seoKeywordsArray.length === 0) {
      throw throwApiError(400, "At least one SEO keyword is required");
    }

    // Convert and validate technicalSpecifications
    let technicalSpecificationsArray = [];
    if (Array.isArray(technicalSpecifications)) {
      technicalSpecificationsArray = technicalSpecifications;
    } else if (typeof technicalSpecifications === "string") {
      try {
        technicalSpecificationsArray = JSON.parse(technicalSpecifications);
      } catch {
        throw throwApiError(400, "Invalid technicalSpecifications format");
      }
    }
    if (
      !Array.isArray(technicalSpecificationsArray) ||
      technicalSpecificationsArray.length === 0
    ) {
      throw throwApiError(
        400,
        "At least one technical specification is required"
      );
    }

    // Convert and validate plantAvailability
    let plantAvailabilityArray = [];
    if (Array.isArray(plantAvailability)) {
      plantAvailabilityArray = plantAvailability;
    } else if (typeof plantAvailability === "string") {
      try {
        plantAvailabilityArray = JSON.parse(plantAvailability);
      } catch {
        throw throwApiError(400, "Invalid plantAvailability format");
      }
    }
    if (
      !Array.isArray(plantAvailabilityArray) ||
      plantAvailabilityArray.length === 0
    ) {
      throw throwApiError(400, "At least one plant availability is required");
    }

    // Convert and validate applications
    const applicationsArray = convertToArray(applications);
    if (!Array.isArray(applicationsArray) || applicationsArray.length === 0) {
      throw throwApiError(400, "At least one application is required");
    }

    // Validate status
    const validStatuses = ["In Stock", "Limited Stock", "Out of Stock"];
    if (!validStatuses.includes(status)) {
      throw throwApiError(400, "Invalid status value");
    }
    const product = await Product.create({
      name,
      abbreviation,
      slug: productSlug,
      natureId,
      plantId,
      description,
      shortDescription,
      images,
      brochure: {
        url: brochureUpload.url,
        title: req.body.brochureTitle || "Product Brochure",
      },
      tds: {
        url: tdsUpload.url,
        title: req.body.tdsTitle || "Technical Data Sheet",
      },
      seoTitle,
      seoDescription,
      seoKeywords: seoKeywordsArray,
      technicalSpecifications: technicalSpecificationsArray,
      plantAvailability: plantAvailabilityArray,
      applications: applicationsArray,
      status,
    });

    // Populate natureId and plantId for response
    const populatedProduct = await Product.findById(product._id)
      .populate("natureId", "name slug")
      .populate("plantId", "name certifications")
      .select("-__v -createdAt -updatedAt");
    return sendResponse(
      res,
      201,
      populatedProduct,
      "Product created successfully"
    );
  } catch (error) {
    // Clean up uploaded files on failure
    for (const file of uploadedFiles) {
      await deleteFromSupabase(file.url, file.type);
    }
    console.error("Error while creating the product:", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw throwApiError(409, `Product with this ${field} already exists`);
    }
    throw throwApiError(
      500,
      `Something went wrong while creating the product: ${error.message}`
    );
  }
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "name",
    sortOrder = "asc",
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  if (pageNum < 1 || limitNum < 1) {
    throw throwApiError(400, "Page and limit must be positive integers");
  }
  const sortDirection = sortOrder === "desc" ? -1 : 1;

  try {
    const totalProducts = await Product.countDocuments();
    const products = await Product.find()
      .populate("natureId", "name slug")
      .populate("plantId", "name certifications")
      .sort({ [sortBy]: sortDirection })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("-__v -createdAt -updatedAt");

    return sendResponse(
      res,
      200,
      {
        products,
        total: totalProducts,
        page: pageNum,
        limit: limitNum,
      },
      "Active products retrieved successfully"
    );
  } catch (error) {
    console.error("Error while retrieving products:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Invalid query parameters");
    }
    throw throwApiError(500, "Something went wrong while retrieving products");
  }
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isObjectId = mongoose.isValidObjectId(id);
  const filter = isObjectId
    ? { _id: id, isActive: true }
    : { slug: id, isActive: true };

  try {
    const product = await Product.findOne(filter)
      .populate("natureId", "name slug")
      .populate("plantId", "name certifications")
      .select("-__v -createdAt -updatedAt");

    if (!product) {
      throw throwApiError(
        404,
        isObjectId
          ? "Product not found or inactive"
          : "Product with this slug not found or inactive"
      );
    }

    return sendResponse(res, 200, product, "Product retrieved successfully");
  } catch (error) {
    console.error("Error while retrieving product:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Invalid product ID or slug format");
    }
    throw throwApiError(
      500,
      "Something went wrong while retrieving the product"
    );
  }
});

export const fetchProductsWithSearch = asyncHandler(async (req, res) => {
  const {
    isActive,
    search,
    query,
    natureId,
    plantId,
    page = 1,
    limit = 10,
    sortBy = "name",
    sortOrder = "asc",
  } = req.query;
  let filter = {};
  // Support direct productId filter for single product fetch (frontend)
  if (req.query.productId) {
    filter._id = req.query.productId;
  }

  // Validate pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  if (pageNum < 1 || limitNum < 1) {
    throw throwApiError(400, "Page and limit must be positive integers");
  }

  // Apply isActive filter
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  // Apply and validate natureId
  if (natureId) {
    if (!mongoose.isValidObjectId(natureId)) {
      throw throwApiError(400, "Invalid Nature ID format");
    }
    const nature = await Nature.findOne({ _id: natureId, isActive: true });
    if (!nature) {
      throw throwApiError(404, "Active Nature not found");
    }
    filter.natureId = natureId;
  }

  // Apply and validate plantId
  if (plantId) {
    if (!mongoose.isValidObjectId(plantId)) {
      throw throwApiError(400, "Invalid Plant ID format");
    }
    const plant = await Plant.findOne({ _id: plantId, isActive: true });
    if (!plant) {
      throw throwApiError(404, "Active Plant not found");
    }
    filter.plantId = plantId;
  }

  // Apply search filter (support both 'search' and 'query' params)
  const searchValue = (query || search || "").trim();
  if (searchValue) {
    const sanitizedSearch = searchValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const hyphenatedSearch = sanitizedSearch.replace(/\s+/g, "-").toLowerCase();
    filter.$or = [
      { name: { $regex: sanitizedSearch, $options: "i" } },
      { slug: { $regex: sanitizedSearch, $options: "i" } },
      { slug: { $regex: hyphenatedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } },
      { shortDescription: { $regex: sanitizedSearch, $options: "i" } },
    ];
  }

  try {
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("natureId", "name slug")
      .populate("plantId", "name certifications")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select("-__v -createdAt -updatedAt");

    return sendResponse(
      res,
      200,
      {
        products,
        total,
        page: pageNum,
        limit: limitNum,
      },
      "Products with search fetched successfully"
    );
  } catch (error) {
    console.error("Error while searching products:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Invalid query parameters or IDs");
    }
    throw throwApiError(500, "Something went wrong while searching products");
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    abbreviation,
    slug,
    natureId,
    plantId,
    description,
    shortDescription,
    seoTitle,
    seoDescription,
    seoKeywords,
    technicalSpecifications,
    plantAvailability,
    applications,
    status,
  } = req.body;
  // Validate ID
  if (!id || !mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Product ID format");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw throwApiError(404, "Product not found");
  }

  // Validate natureId and plantId if provided
  if (natureId) {
    if (!mongoose.isValidObjectId(natureId)) {
      throw throwApiError(400, "Invalid Nature ID format");
    }
    const nature = await Nature.findOne({ _id: natureId, isActive: true });
    if (!nature) {
      throw throwApiError(404, "Active Nature not found");
    }
  }

  if (plantId) {
    if (!mongoose.isValidObjectId(plantId)) {
      throw throwApiError(400, "Invalid Plant ID format");
    }
    const plant = await Plant.findOne({ _id: plantId, isActive: true });
    if (!plant) {
      throw throwApiError(404, "Active Plant not found");
    }
  }

  // --- ROBUST IMAGE MERGE LOGIC START ---
  // Build a map of old images by URL for easy lookup
  const oldImages = product.images || [];
  const oldImagesMap = {};
  for (const img of oldImages) {
    oldImagesMap[img.url] = img;
  }
  let images = [];
  const deletedFiles = [];
  let primaryCount = 0;

  // Find all image indexes from the request (order matters)
  let imageIndexes = [];
  Object.keys(req.body).forEach((key) => {
    const match = key.match(/^images\[(\d+)\]/);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (!imageIndexes.includes(idx)) imageIndexes.push(idx);
    }
  });
  imageIndexes = imageIndexes.sort((a, b) => a - b);

  // Track which old images are kept
  const keptOldUrls = new Set();

  for (let i = 0; i < imageIndexes.length; i++) {
    let imgObj = null;
    // If a file is present for this index, use it
    const file = req.files?.images?.find(
      (f) =>
        f.fieldname === `images` &&
        f.originalname === req.body[`images[${i}].alt`]
    );
    if (file) {
      const uploadResult = await uploadToSupabase(file, "products");
      if (!uploadResult?.url) {
        throw throwApiError(500, "Failed to upload image to Supabase");
      }
      imgObj = {
        url: uploadResult.url,
        alt: req.body[`images[${i}].alt`] || file.originalname,
        isPrimary: req.body[`images[${i}].isPrimary`] === "true" || false,
      };
    } else {
      // No file, so use the old image URL
      const url = req.body[`images[${i}].url`];
      if (url && oldImagesMap[url]) {
        imgObj = {
          url,
          alt: req.body[`images[${i}].alt`] || oldImagesMap[url].alt || "",
          isPrimary: req.body[`images[${i}].isPrimary`] === "true" || false,
        };
        keptOldUrls.add(url);
      }
    }
    if (imgObj) {
      if (imgObj.isPrimary) primaryCount++;
      images.push(imgObj);
    }
  }
  // Any old images not in keptOldUrls are removed by the user, so delete them
  for (const img of oldImages) {
    if (!keptOldUrls.has(img.url)) {
      deletedFiles.push({ url: img.url, type: "products" });
    }
  }
  // Enforce max 5 images
  if (images.length > 5) {
    throw throwApiError(400, "Maximum 5 images allowed");
  }
  if (images.length === 0) {
    throw throwApiError(400, "At least one image is required");
  }
  if (primaryCount !== 1) {
    throw throwApiError(400, "Exactly one image must be marked as primary");
  }
  // --- ROBUST IMAGE MERGE LOGIC END ---

  let brochure = product.brochure;
  if (req.files?.brochure?.[0]) {
    deletedFiles.push({ url: product.brochure.url, type: "products" });
    const brochureUpload = await uploadToSupabase(
      req.files.brochure[0],
      "products"
    );
    if (!brochureUpload?.url) {
      throw throwApiError(500, "Failed to upload brochure to Supabase");
    }
    brochure = {
      url: brochureUpload.url,
      title: req.body.brochureTitle || product.brochure.title,
    };
  }

  let tds = product.tds;
  if (req.files?.tds?.[0]) {
    deletedFiles.push({ url: product.tds.url, type: "products" });
    const tdsUpload = await uploadToSupabase(req.files.tds[0], "products");
    if (!tdsUpload?.url) {
      throw throwApiError(500, "Failed to upload TDS to Supabase");
    }
    tds = {
      url: tdsUpload.url,
      title: req.body.tdsTitle || product.tds.title,
    };
  }

  // Generate slug if name is updated
  const productSlug =
    slug || (name && name !== product.name ? generateSlug(name) : product.slug);

  // Check for duplicate name or slug
  if (name || slug) {
    const existingProduct = await Product.findOne({
      $or: [{ name: name?.toLowerCase() }, { slug: productSlug }],
      _id: { $ne: id },
    });
    if (existingProduct) {
      throw throwApiError(409, "Product with this name or slug already exists");
    }
  }

  // Handle array fields
  const seoKeywordsArray = seoKeywords
    ? convertToArray(seoKeywords)
    : product.seoKeywords;
  if (seoKeywordsArray.length === 0) {
    throw throwApiError(400, "At least one SEO keyword is required");
  }

  // Convert and validate technicalSpecifications
  let technicalSpecificationsArray = product.technicalSpecifications || [];
  if (typeof technicalSpecifications !== "undefined") {
    if (Array.isArray(technicalSpecifications)) {
      technicalSpecificationsArray = technicalSpecifications;
    } else if (typeof technicalSpecifications === "string") {
      try {
        technicalSpecificationsArray = JSON.parse(technicalSpecifications);
      } catch {
        throw throwApiError(400, "Invalid technicalSpecifications format");
      }
    }
  }
  if (
    !Array.isArray(technicalSpecificationsArray) ||
    technicalSpecificationsArray.length === 0
  ) {
    throw throwApiError(
      400,
      "At least one technical specification is required"
    );
  }

  // Convert and validate plantAvailability
  let plantAvailabilityArray = product.plantAvailability || [];
  if (typeof plantAvailability !== "undefined") {
    if (Array.isArray(plantAvailability)) {
      plantAvailabilityArray = plantAvailability;
    } else if (typeof plantAvailability === "string") {
      try {
        plantAvailabilityArray = JSON.parse(plantAvailability);
      } catch {
        throw throwApiError(400, "Invalid plantAvailability format");
      }
    }
  }
  if (
    !Array.isArray(plantAvailabilityArray) ||
    plantAvailabilityArray.length === 0
  ) {
    throw throwApiError(400, "At least one plant availability is required");
  }

  // Convert and validate applications
  const applicationsArray =
    typeof applications !== "undefined"
      ? convertToArray(applications)
      : product.applications;
  if (!Array.isArray(applicationsArray) || applicationsArray.length === 0) {
    throw throwApiError(400, "At least one application is required");
  }

  // Validate status
  const validStatuses = ["In Stock", "Limited Stock", "Out of Stock"];
  const statusValue = typeof status !== "undefined" ? status : product.status;
  if (!validStatuses.includes(statusValue)) {
    throw throwApiError(400, "Invalid status value");
  }
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name || product.name,
        abbreviation: abbreviation || product.abbreviation,
        slug: productSlug,
        natureId: natureId || product.natureId,
        plantId: plantId || product.plantId,
        description: description || product.description,
        shortDescription: shortDescription || product.shortDescription,
        images,
        brochure,
        tds,
        seoTitle: seoTitle || product.seoTitle,
        seoDescription: seoDescription || product.seoDescription,
        seoKeywords: seoKeywordsArray,
        technicalSpecifications: technicalSpecificationsArray,
        plantAvailability: plantAvailabilityArray,
        applications: applicationsArray,
        status: statusValue,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate("natureId", "name slug")
      .populate("plantId", "name certifications")
      .select("-__v -createdAt -updatedAt");

    // Delete old files from Supabase
    for (const file of deletedFiles) {
      await deleteFromSupabase(file.url, file.type);
    }

    return sendResponse(
      res,
      200,
      updatedProduct,
      "Product updated successfully"
    );
  } catch (error) {
    console.error("Error while updating product:", error.message);
    if (error instanceof mongoose.Error.ValidationError) {
      throw throwApiError(400, `Validation failed: ${error.message}`);
    }
    if (error.code === 11000) {
      throw throwApiError(409, "Product with this name or slug already exists");
    }
    throw throwApiError(500, "Something went wrong while updating the product");
  }
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Product ID format");
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      throw throwApiError(404, "Product not found");
    }

    // Check for dependencies (e.g., orders) if applicable
    // Example: const orders = await Order.find({ productId: id, status: { $ne: 'cancelled' } });
    // if (orders.length > 0) {
    //   throw throwApiError(400, "Cannot deactivate Product because it is associated with active orders");
    // }

    product.isActive = false;
    product.updatedAt = new Date();
    await product.save();

    const populatedProduct = await Product.findById(id)
      .populate("natureId", "name slug")
      .populate("plantId", "name certifications")
      .select("-__v -createdAt -updatedAt");

    return sendResponse(
      res,
      200,
      populatedProduct,
      "Product soft deleted successfully"
    );
  } catch (error) {
    console.error("Error while soft deleting product:", error.message);
    if (error instanceof mongoose.Error.CastError) {
      throw throwApiError(400, "Invalid Product ID format");
    }
    throw throwApiError(
      500,
      "Something went wrong while soft deleting the product"
    );
  }
});

export const permanentDeleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Product ID format");
  }

  try {
    const product = await Product.findById(id)
      .populate("natureId", "name slug")
      .populate("plantId", "name certifications");
    if (!product) {
      throw throwApiError(404, "Product not found");
    }

    // Check for dependencies (e.g., orders) if applicable
    // Example: const orders = await Order.find({ productId: id });
    // if (orders.length > 0) {
    //   throw throwApiError(400, "Cannot permanently delete Product because it is associated with orders");
    // }

    // Delete associated files from Supabase
    for (const image of product.images) {
      await deleteFromSupabase(image.url, "products");
    }
    if (product.brochure?.url) {
      await deleteFromSupabase(product.brochure.url, "products");
    }
    if (product.tds?.url) {
      await deleteFromSupabase(product.tds.url, "products");
    }

    // Delete the product from MongoDB
    await Product.findByIdAndDelete(id);

    return sendResponse(
      res,
      200,
      product,
      "Product and associated files permanently deleted successfully"
    );
  } catch (error) {
    console.error("Error while permanently deleting product:", error.message);
    if (error instanceof mongoose.Error.CastError) {
      throw throwApiError(400, "Invalid Product ID format");
    }
    throw throwApiError(
      500,
      "Something went wrong while permanently deleting the product"
    );
  }
});

export const toggleProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Product ID format");
  }

  try {
    const product = await Product.findById(id)
      .populate("natureId", "name slug isActive")
      .populate("plantId", "name certifications");

    if (!product) {
      throw throwApiError(404, "Product not found");
    }

    // If activating, check if Nature and Plant are active
    if (!product.isActive) {
      if (!product.natureId?.isActive) {
        throw throwApiError(
          400,
          "Cannot activate Product with an inactive Nature"
        );
      }
      if (!product.plantId?.isActive) {
        throw throwApiError(
          400,
          "Cannot activate Product with an inactive Plant"
        );
      }
    }

    // If deactivating, check for dependencies (e.g., orders)
    // Example: const orders = await Order.find({ productId: id, status: 'active' });
    // if (orders.length > 0) {
    //   throw throwApiError(400, "Cannot deactivate Product with active orders");
    // }

    product.isActive = !product.isActive;
    product.updatedAt = new Date();
    await product.save();

    const populatedProduct = await Product.findById(id)
      .populate("natureId", "name slug")
      .populate("plantId", "name certifications")
      .select("-__v -createdAt -updatedAt");

    return sendResponse(
      res,
      200,
      populatedProduct,
      `Product ${product.isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (error) {
    console.error("Error while toggling product status:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Invalid ID format or database error");
    }
    throw throwApiError(
      500,
      "Something went wrong while toggling product status"
    );
  }
});

export const getProductStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactiveProducts: { $sum: { $cond: ["$isActive", 0, 1] } },
          uniqueNatures: { $addToSet: "$natureId" },
          uniquePlants: { $addToSet: "$plantId" },
        },
      },
      {
        $project: {
          _id: 0,
          totalProducts: 1,
          activeProducts: 1,
          inactiveProducts: 1,
          totalNatures: { $size: "$uniqueNatures" },
          totalPlants: { $size: "$uniquePlants" },
        },
      },
    ]);

    const response = stats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      totalNatures: 0,
      totalPlants: 0,
    };

    return sendResponse(
      res,
      200,
      response,
      "Product statistics retrieved successfully"
    );
  } catch (error) {
    console.error("Error while fetching product statistics:", error.message);
    if (error instanceof mongoose.Error) {
      throw throwApiError(400, "Database error while fetching statistics");
    }
    throw throwApiError(
      500,
      "Something went wrong while fetching product statistics"
    );
  }
});
