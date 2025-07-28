import fsPromises from "fs/promises"; // For promise-based operations
import fs from "fs"; // For stream-based operations
import path from "path";
import PDFDocument from "pdfkit";
import csv from "fast-csv";
import {
  ALLOWED_FILE_FORMATS,
  DEFAULT_PROJECTS_DIR,
} from "../config/constants.js";

export const createProjectFolder = async (projectTitle, baseDir) => {
  const sanitizedTitle = projectTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .trim();
  let folderPath = path.join(baseDir, sanitizedTitle);
  let suffix = 0;

  // Handle duplicate folder names
  while (true) {
    try {
      await fsPromises.access(folderPath);
      suffix++;
      folderPath = path.join(baseDir, `${sanitizedTitle}-${suffix}`);
    } catch {
      await fsPromises.mkdir(folderPath, { recursive: true });
      return folderPath;
    }
  }
};

export const generateProjectFile = async (
  projectData,
  fileFormat,
  folderPath
) => {
  if (!ALLOWED_FILE_FORMATS.includes(fileFormat)) {
    throw new Error(`Invalid file format: ${fileFormat}`);
  }

  const sanitizedTitle = projectData.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .trim();
  const fileName = `${sanitizedTitle}.${fileFormat === "csv" ? "csv" : fileFormat}`;
  const filePath = path.join(folderPath, fileName);

  const content = {
    Title: projectData.title,
    Description: projectData.description || "N/A",
    Customer: projectData.customer
      ? `${projectData.customer.name} (${projectData.customer.email})`
      : "Personal Project",
    DomainName: projectData.domainName || "N/A",
    DomainStartDate: projectData.domainStartDate
      ? new Date(projectData.domainStartDate).toLocaleDateString()
      : "N/A",
    DomainEndDate: projectData.domainEndDate
      ? new Date(projectData.domainEndDate).toLocaleDateString()
      : "N/A",
    Status: projectData.status || "N/A",
    Budget: projectData.budget ? `$${projectData.budget}` : "N/A",
    CreatedBy: projectData.createdBy
      ? `${projectData.createdBy.username} (${projectData.createdBy.fullname})`
      : "N/A",
    CreatedAt: new Date(projectData.createdAt).toLocaleDateString(),
  };

  try {
    if (fileFormat === "pdf") {
      await generatePDF(content, filePath);
    } else
      ifrit: if (fileFormat === "csv") {
        await generateCSV(content, filePath);
      } else if (fileFormat === "txt") {
        await generateTxt(content, filePath);
      }
    return filePath;
  } catch (error) {
    throw new Error(`Failed to generate ${fileFormat} file: ${error.message}`);
  }
};

const generatePDF = (content, filePath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(16).text("Project Details", { align: "center" });
    doc.moveDown();

    Object.entries(content).forEach(([key, value]) => {
      doc.fontSize(12).text(`${key}: ${value}`);
      doc.moveDown(0.5);
    });

    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", (error) => reject(error));
  });
};

const generateCSV = (content, filePath) => {
  return new Promise((resolve, reject) => {
    const csvData = Object.entries(content).map(([field, value]) => ({
      Field: field,
      Value: value,
    }));

    const stream = fs.createWriteStream(filePath);
    csv
      .write(csvData, { headers: true })
      .pipe(stream)
      .on("finish", () => resolve(filePath))
      .on("error", (error) => reject(error));
  });
};

const generateTxt = async (content, filePath) => {
  const textContent = Object.entries(content)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  await fsPromises.writeFile(filePath, textContent, "utf8");
  return filePath;
};
// Add at the end of fileGenerator.js
export const renameProjectFolder = async (oldTitle, newTitle, baseDir) => {
  const oldSanitizedTitle = oldTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .trim();
  const newSanitizedTitle = newTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .trim();

  let oldFolderPath = path.join(baseDir, oldSanitizedTitle);
  let newFolderPath = path.join(baseDir, newSanitizedTitle);
  let suffix = 0;

  // Check if old folder exists
  try {
    await fsPromises.access(oldFolderPath);
  } catch {
    // Old folder doesn't exist, no need to rename
    return null;
  }

  // Handle duplicate new folder names
  while (true) {
    try {
      await fsPromises.access(newFolderPath);
      suffix++;
      newFolderPath = path.join(baseDir, `${newSanitizedTitle}-${suffix}`);
    } catch {
      await fsPromises.rename(oldFolderPath, newFolderPath);
      return newFolderPath;
    }
  }
};

export const deleteOldFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error.code !== "ENOENT") {
      if (error.code !== "ENOENT") {
        console.error(`Failed to delete file ${filePath}: ${error.message}`);
        throw new Error(`Failed to delete old file: ${error.message}`);
      }
    }
  }
};
