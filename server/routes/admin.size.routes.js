import express from "express";
import { prisma } from "../config/db.js";
import { isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();
// using shared `prisma` from `config/db.js`

// Get all sizes
router.get("/sizes", isAdmin, async (req, res) => {
  try {
    const sizes = await prisma.size.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return res.status(200).json({
      success: true,
      message: "Sizes fetched successfully",
      data: { sizes },
    });
  } catch (error) {
    console.error("Error fetching sizes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sizes",
      error: error.message,
    });
  }
});

// Get a size by ID
router.get("/sizes/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const size = await prisma.size.findUnique({
      where: { id },
    });

    if (!size) {
      return res.status(404).json({
        success: false,
        message: "Size not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Size fetched successfully",
      data: { size },
    });
  } catch (error) {
    console.error("Error fetching size:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch size",
      error: error.message,
    });
  }
});

// Create a new size
router.post("/sizes", isAdmin, async (req, res) => {
  try {
    const { name, order, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Size name is required",
      });
    }

    // Check if size with the same name exists
    const existingSize = await prisma.size.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (existingSize) {
      return res.status(400).json({
        success: false,
        message: "A size with this name already exists",
      });
    }

    // Get the highest order value if order is not provided
    let sizeOrder = order;
    if (sizeOrder === undefined || sizeOrder === null) {
      const maxOrderSize = await prisma.size.findFirst({
        orderBy: { order: "desc" },
      });
      sizeOrder = maxOrderSize ? maxOrderSize.order + 1 : 0;
    }

    // Create size
    const newSize = await prisma.size.create({
      data: {
        name,
        order: sizeOrder,
        description: description || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Size created successfully",
      data: { size: newSize },
    });
  } catch (error) {
    console.error("Error creating size:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create size",
      error: error.message,
    });
  }
});

// Update a size
router.patch("/sizes/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order, description } = req.body;

    // Check if size exists
    const existingSize = await prisma.size.findUnique({
      where: { id },
    });

    if (!existingSize) {
      return res.status(404).json({
        success: false,
        message: "Size not found",
      });
    }

    const updateData = {};

    if (name !== undefined) {
      // Check if another size with the same name exists
      const duplicateSize = await prisma.size.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          id: { not: id },
        },
      });

      if (duplicateSize) {
        return res.status(400).json({
          success: false,
          message: "A size with this name already exists",
        });
      }
      updateData.name = name;
    }

    if (order !== undefined) {
      updateData.order = parseInt(order);
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    // Update size
    const updatedSize = await prisma.size.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Size updated successfully",
      data: { size: updatedSize },
    });
  } catch (error) {
    console.error("Error updating size:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update size",
      error: error.message,
    });
  }
});

// Delete a size
router.delete("/sizes/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if size exists
    const size = await prisma.size.findUnique({
      where: { id },
    });

    if (!size) {
      return res.status(404).json({
        success: false,
        message: "Size not found",
      });
    }

    // Check if size is used in any product variant
    const variantsUsingSize = await prisma.productVariant.count({
      where: { sizeId: id },
    });

    if (variantsUsingSize > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete size. It is being used by ${variantsUsingSize} product variants.`,
      });
    }

    // Delete size
    await prisma.size.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Size deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting size:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete size",
      error: error.message,
    });
  }
});

export default router;
