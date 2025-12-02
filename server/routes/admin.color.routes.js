import express from "express";
import { prisma } from "../config/db.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3client from "../utils/s3client.js";
import { deleteFromS3, getFileUrl } from "../utils/deleteFromS3.js";
import { isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();
// using shared `prisma` from `config/db.js`

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Get all colors
router.get("/colors", isAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let where = {};

    if (search) {
      where = {
        name: {
          contains: search,
          mode: "insensitive",
        },
      };
    }

    const colors = await prisma.color.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // Add complete image URLs to colors
    const colorsWithImageUrls = colors.map((color) => ({
      ...color,
      image: color.image ? getFileUrl(color.image) : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Colors fetched successfully",
      data: { colors: colorsWithImageUrls },
    });
  } catch (error) {
    console.error("Error fetching colors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch colors",
      error: error.message,
    });
  }
});

// Get a color by ID
router.get("/colors/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const color = await prisma.color.findUnique({
      where: { id },
    });

    if (!color) {
      return res.status(404).json({
        success: false,
        message: "Color not found",
      });
    }

    // Add complete image URL to color
    const colorWithImageUrl = {
      ...color,
      image: color.image ? getFileUrl(color.image) : null,
    };

    return res.status(200).json({
      success: true,
      message: "Color fetched successfully",
      data: { color: colorWithImageUrl },
    });
  } catch (error) {
    console.error("Error fetching color:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch color",
      error: error.message,
    });
  }
});

// Create a new color
router.post("/colors", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, hexCode, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Color name is required",
      });
    }

    // Check if color with the same name exists
    const existingColor = await prisma.color.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (existingColor) {
      return res.status(400).json({
        success: false,
        message: "A color with this name already exists",
      });
    }

    let imageKey = null;

    // Upload image to S3 if provided
    if (req.file) {
      const uploadFolder = process.env.UPLOAD_FOLDER || "ecom-uploads";
      imageKey = `${uploadFolder}/colors/${uuidv4()}-${req.file.originalname.replace(
        /\s+/g,
        "-"
      )}`;

      await s3client.send(
        new PutObjectCommand({
          Bucket: process.env.SPACES_BUCKET,
          Key: imageKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: "public-read",
        })
      );
    }

    // Create color
    const newColor = await prisma.color.create({
      data: {
        name,
        hexCode: hexCode || null,
        description: description || null,
        image: imageKey,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Color created successfully",
      data: {
        color: {
          ...newColor,
          image: imageKey ? getFileUrl(imageKey) : null,
        },
      },
    });
  } catch (error) {
    console.error("Error creating color:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create color",
      error: error.message,
    });
  }
});

// Update a color
router.patch(
  "/colors/:id",
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, hexCode, description } = req.body;

      // Check if color exists
      const existingColor = await prisma.color.findUnique({
        where: { id },
      });

      if (!existingColor) {
        return res.status(404).json({
          success: false,
          message: "Color not found",
        });
      }

      // Check if another color with the same name exists
      if (name) {
        const duplicateColor = await prisma.color.findFirst({
          where: {
            name: { equals: name, mode: "insensitive" },
            id: { not: id },
          },
        });

        if (duplicateColor) {
          return res.status(400).json({
            success: false,
            message: "A color with this name already exists",
          });
        }
      }

      // Prepare update data
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (hexCode !== undefined) updateData.hexCode = hexCode;
      if (description !== undefined) updateData.description = description;

      // Handle image update
      let imageKey = existingColor.image;

      if (req.file) {
        // Delete old image if it exists
        if (existingColor.image) {
          await deleteFromS3(existingColor.image);
        }

        // Upload new image
        const uploadFolder = process.env.UPLOAD_FOLDER || "ecom-uploads";
        imageKey = `${uploadFolder}/colors/${uuidv4()}-${req.file.originalname.replace(
          /\s+/g,
          "-"
        )}`;

        await s3client.send(
          new PutObjectCommand({
            Bucket: process.env.SPACES_BUCKET,
            Key: imageKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: "public-read",
          })
        );

        updateData.image = imageKey;
      }

      // Update color
      const updatedColor = await prisma.color.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json({
        success: true,
        message: "Color updated successfully",
        data: {
          color: {
            ...updatedColor,
            image: updatedColor.image ? getFileUrl(updatedColor.image) : null,
          },
        },
      });
    } catch (error) {
      console.error("Error updating color:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update color",
        error: error.message,
      });
    }
  }
);

// Delete a color
router.delete("/colors/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if color exists
    const color = await prisma.color.findUnique({
      where: { id },
    });

    if (!color) {
      return res.status(404).json({
        success: false,
        message: "Color not found",
      });
    }

    // Check if color is used in any product variant
    const variantsUsingColor = await prisma.productVariant.count({
      where: { colorId: id },
    });

    if (variantsUsingColor > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete color. It is being used by ${variantsUsingColor} product variants.`,
      });
    }

    // Delete image from S3 if it exists
    if (color.image) {
      await deleteFromS3(color.image);
    }

    // Delete color
    await prisma.color.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Color deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting color:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete color",
      error: error.message,
    });
  }
});

export default router;
