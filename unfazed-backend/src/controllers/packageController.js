const mongoose = require("mongoose");

const Package = require("../models/Package");

// Create a package
const createPackage = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;

    const {
      name,
      session_count,
      price_per_session,
      validity_days,
      description,
      is_active,
    } = req.body;

    const sessionCount = Number(session_count);
    const pricePerSession = Number(price_per_session);
    const validityDays = Number(validity_days);

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Package name is required",
      });
    }

    if (![3, 6, 12].includes(sessionCount)) {
      return res.status(400).json({
        success: false,
        message:
          "Session count must be 3, 6 or 12",
      });
    }

    if (
      !Number.isFinite(pricePerSession) ||
      pricePerSession < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Price per session must be a valid non-negative number",
      });
    }

    if (
      !Number.isInteger(validityDays) ||
      validityDays <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Validity days must be a positive whole number",
      });
    }

    const totalPrice = Number(
      (pricePerSession * sessionCount).toFixed(2)
    );

    const packageExists = await Package.findOne({
      therapist_id: therapistId,
      name: name.trim(),
    });

    if (packageExists) {
      return res.status(409).json({
        success: false,
        message:
          "A package with this name already exists",
      });
    }

    const therapistPackage = await Package.create({
      therapist_id: therapistId,
      name: name.trim(),
      session_count: sessionCount,
      price_per_session: pricePerSession,
      total_price: totalPrice,
      validity_days: validityDays,
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      is_active:
        is_active !== undefined
          ? Boolean(is_active)
          : true,
    });

    return res.status(201).json({
      success: true,
      message: "Package created successfully",
      package: therapistPackage,
    });
  } catch (error) {
    next(error);
  }
};

// Get all packages for logged-in therapist
const getMyPackages = async (req, res, next) => {
  try {
    const therapistId = req.therapistId;

    const packages = await Package.find({
      therapist_id: therapistId,
    })
      .select("-__v")
      .sort({
        session_count: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: packages.length,
      packages,
    });
  } catch (error) {
    next(error);
  }
};

// Get active packages publicly
const getPublicPackages = async (
  req,
  res,
  next
) => {
  try {
    const { slug } = req.params;

    const Therapist = require("../models/Therapist");

    const therapist = await Therapist.findOne({
      slug: slug.toLowerCase(),
    })
      .select("_id name slug")
      .lean();

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    const packages = await Package.find({
      therapist_id: therapist._id,
      is_active: true,
    })
      .select(
        "name session_count price_per_session total_price currency validity_days description"
      )
      .sort({
        session_count: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        slug: therapist.slug,
      },
      packages,
    });
  } catch (error) {
    next(error);
  }
};

// Get one package belonging to therapist
const getPackageById = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const therapistPackage =
      await Package.findOne({
        _id: id,
        therapist_id: therapistId,
      })
        .select("-__v")
        .lean();

    if (!therapistPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    return res.status(200).json({
      success: true,
      package: therapistPackage,
    });
  } catch (error) {
    next(error);
  }
};

// Update package
const updatePackage = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const therapistPackage =
      await Package.findOne({
        _id: id,
        therapist_id: therapistId,
      });

    if (!therapistPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    const {
      name,
      session_count,
      price_per_session,
      validity_days,
      description,
      is_active,
    } = req.body;

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Package name cannot be empty",
        });
      }

      const duplicatePackage =
        await Package.findOne({
          therapist_id: therapistId,
          name: name.trim(),
          _id: {
            $ne: id,
          },
        });

      if (duplicatePackage) {
        return res.status(409).json({
          success: false,
          message:
            "A package with this name already exists",
        });
      }

      therapistPackage.name = name.trim();
    }

    if (session_count !== undefined) {
      const sessionCount =
        Number(session_count);

      if (![3, 6, 12].includes(sessionCount)) {
        return res.status(400).json({
          success: false,
          message:
            "Session count must be 3, 6 or 12",
        });
      }

      therapistPackage.session_count =
        sessionCount;
    }

    if (price_per_session !== undefined) {
      const pricePerSession =
        Number(price_per_session);

      if (
        !Number.isFinite(pricePerSession) ||
        pricePerSession < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Price per session must be a valid non-negative number",
        });
      }

      therapistPackage.price_per_session =
        pricePerSession;
    }

    if (validity_days !== undefined) {
      const validityDays =
        Number(validity_days);

      if (
        !Number.isInteger(validityDays) ||
        validityDays <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Validity days must be a positive whole number",
        });
      }

      therapistPackage.validity_days =
        validityDays;
    }

    if (description !== undefined) {
      therapistPackage.description =
        typeof description === "string"
          ? description.trim()
          : "";
    }

    if (is_active !== undefined) {
      therapistPackage.is_active =
        Boolean(is_active);
    }

    therapistPackage.total_price = Number(
      (
        therapistPackage.price_per_session *
        therapistPackage.session_count
      ).toFixed(2)
    );

    await therapistPackage.save();

    return res.status(200).json({
      success: true,
      message: "Package updated successfully",
      package: therapistPackage,
    });
  } catch (error) {
    next(error);
  }
};

// Delete package
const deletePackage = async (
  req,
  res,
  next
) => {
  try {
    const therapistId = req.therapistId;
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const therapistPackage =
      await Package.findOneAndDelete({
        _id: id,
        therapist_id: therapistId,
      });

    if (!therapistPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPackage,
  getMyPackages,
  getPublicPackages,
  getPackageById,
  updatePackage,
  deletePackage,
};