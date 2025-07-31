import mongoose from "mongoose";
import { Inquiry } from "../models/inquires.model.js";
import { throwApiError } from "../utils/apiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

export const createInquiry = asyncHandler(async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    companyName,
    city,
    purpose,
    consent,
    selectedProducts,
    description,
    status,
    replies,
  } = req.body;
  if (
    !customerName ||
    !customerEmail ||
    !customerPhone ||
    !companyName ||
    !city ||
    !purpose ||
    consent === undefined ||
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
    const inquiry = await Inquiry.create({
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      city,
      purpose,
      consent,
      selectedProducts,
      description,
      status,
      replies,
    });
    return sendResponse(res, 201, inquiry, "Inquiry created successfully");
  } catch (error) {
    throw throwApiError(
      500,
      error.message || "Something went wrong while creating the inquiry"
    );
  }
});

export const getAllInquiries = asyncHandler(async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    return sendResponse(res, 200, inquiries, "Inquiries fetched successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while retrieving inquiries");
  }
});

export const getInquiryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Inquiry ID format");
  }
  try {
    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      throw throwApiError(404, "Inquiry not found");
    }
    return sendResponse(res, 200, inquiry, "Inquiry fetched successfully");
  } catch (error) {
    throw throwApiError(
      500,
      "Something went wrong while retrieving the inquiry"
    );
  }
});

export const updateInquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Inquiry ID format");
  }
  const updateData = req.body;
  try {
    // Fetch current inquiry to compare replies
    const oldInquiry = await Inquiry.findById(id);
    if (!oldInquiry) {
      throw throwApiError(404, "Inquiry not found");
    }
    const oldReplies = oldInquiry.replies || [];
    const newReplies = updateData.replies || oldReplies;
    const isNewReply = newReplies.length > oldReplies.length;
    const latestReply = isNewReply ? newReplies[newReplies.length - 1] : null;

    // Update inquiry
    const inquiry = await Inquiry.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!inquiry) {
      throw throwApiError(404, "Inquiry not found");
    }

    // If a new reply was added, send email notification
    if (isNewReply && latestReply) {
      await sendEmail(
        inquiry.customerEmail,
        "New Reply to Your Inquiry",
        `Dear ${inquiry.customerName},\n\nYou have received a new reply from our team:\n\n${latestReply.message}\n\nThank you!`,
        `<p>Dear ${inquiry.customerName},</p><p>You have received a new reply from our team:</p><blockquote>${latestReply.message}</blockquote><p>Thank you!</p>`
      );
    }

    return sendResponse(res, 200, inquiry, "Inquiry updated successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while updating the inquiry");
  }
});

export const deleteInquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw throwApiError(400, "Invalid Inquiry ID format");
  }
  try {
    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
      throw throwApiError(404, "Inquiry not found");
    }
    return sendResponse(res, 200, inquiry, "Inquiry deleted successfully");
  } catch (error) {
    throw throwApiError(500, "Something went wrong while deleting the inquiry");
  }
});
