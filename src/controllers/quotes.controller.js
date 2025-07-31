import mongoose from "mongoose";
import { Quote } from "../models/quote.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

export const createQuote = asyncHandler(async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    city,
    selectedProducts,
    status,
    replies,
  } = req.body;
  if (
    !customerName ||
    !customerEmail ||
    !customerPhone ||
    !city ||
    !selectedProducts ||
    !Array.isArray(selectedProducts) ||
    selectedProducts.length === 0 ||
    !status
  ) {
    throw throwApiError(
      400,
      "All required fields must be provided, and selectedProducts must be a non-empty array"
    );
  }
  try {
    const quote = await Quote.create({
      customerName,
      customerEmail,
      customerPhone,
      city,
      selectedProducts,
      status,
      replies,
    });
    return sendResponse(res, 201, quote, "Quote created successfully");
  } catch (error) {
    throw throwApiError(
      500,
      error.message || "Something went wrong while creating the quote"
    );
  }
});

export const getAllQuotes = asyncHandler(async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    return sendResponse(res, 200, quotes, "Quotes fetched successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while retrieving quotes");
  }
});

export const getQuoteById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Quote ID format");
  }
  try {
    const quote = await Quote.findById(id);
    if (!quote) {
      throw throwApiError(404, "Quote not found");
    }
    return sendResponse(res, 200, quote, "Quote fetched successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while retrieving the quote");
  }
});

export const updateQuote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Quote ID format");
  }
  const updateData = req.body;
  try {
    // Fetch current quote to compare replies
    const oldQuote = await Quote.findById(id);
    if (!oldQuote) {
      throw throwApiError(404, "Quote not found");
    }
    const oldReplies = oldQuote.replies || [];
    const newReplies = updateData.replies || oldReplies;
    const isNewReply = newReplies.length > oldReplies.length;
    const latestReply = isNewReply ? newReplies[newReplies.length - 1] : null;

    // Update quote
    const quote = await Quote.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!quote) {
      throw throwApiError(404, "Quote not found");
    }

    // If a new reply was added, send email notification
    if (isNewReply && latestReply) {
      await sendEmail(
        quote.customerEmail,
        "New Reply to Your Quote Request",
        `Dear ${quote.customerName},\n\nYou have received a new reply from our team:\n\n${latestReply.message}\n\nThank you!`,
        `<p>Dear ${quote.customerName},</p><p>You have received a new reply from our team:</p><blockquote>${latestReply.message}</blockquote><p>Thank you!</p>`
      );
    }

    return sendResponse(res, 200, quote, "Quote updated successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while updating the quote");
  }
});

export const deleteQuote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Quote ID format");
  }
  try {
    const quote = await Quote.findByIdAndDelete(id);
    if (!quote) {
      throw throwApiError(404, "Quote not found");
    }
    return sendResponse(res, 200, quote, "Quote deleted successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while deleting the quote");
  }
});
