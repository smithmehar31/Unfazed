const bcrypt = require("bcryptjs");
const Therapist = require("../models/Therapist");

// Register Therapist
const registerTherapist = async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      bio = "",
      specializations = [],
      languages = [],
    } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Clean email and name
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // Check if therapist already exists
    const existingTherapist = await Therapist.findOne({
      email: cleanEmail,
    });

    if (existingTherapist) {
      return res.status(409).json({
        success: false,
        message: "Therapist with this email already exists",
      });
    }

    // Create base slug
    const baseSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    let slug = baseSlug;
    let counter = 2;

    // Check slug uniqueness
    while (await Therapist.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create therapist
    const therapist = await Therapist.create({
      email: cleanEmail,
      password_hash,
      name: cleanName,
      slug,
      bio,
      specializations,
      languages,
    });

    res.status(201).json({
      success: true,
      message: "Therapist registered successfully",
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get logged-in therapist profile
const getMyProfile = async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.therapistId).select(
      "-password_hash"
    );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    res.status(200).json({
      success: true,
      therapist,
    });
  } catch (error) {
    next(error);
  }
};

// Update logged-in therapist profile
const updateMyProfile = async (req, res, next) => {
  try {
    const {
      name,
      bio,
      specializations,
      languages,
    } = req.body;

    const therapist = await Therapist.findById(req.therapistId);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist not found",
      });
    }

    // Update name
    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      therapist.name = trimmedName;
    }

    // Update bio
    if (bio !== undefined) {
      therapist.bio = bio;
    }

    // Update specializations
    if (specializations !== undefined) {
      if (!Array.isArray(specializations)) {
        return res.status(400).json({
          success: false,
          message: "Specializations must be an array",
        });
      }

      therapist.specializations = specializations;
    }

    // Update languages
    if (languages !== undefined) {
      if (!Array.isArray(languages)) {
        return res.status(400).json({
          success: false,
          message: "Languages must be an array",
        });
      }

      therapist.languages = languages;
    }

    await therapist.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        bio: therapist.bio,
        specializations: therapist.specializations,
        languages: therapist.languages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get public therapist profile by slug
const getPublicTherapistProfile = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const therapist = await Therapist.findOne({
      slug: slug.toLowerCase().trim(),
    }).select("name slug bio specializations languages");

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: "Therapist profile not found",
      });
    }

    res.status(200).json({
      success: true,
      therapist,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerTherapist,
  getMyProfile,
  updateMyProfile,
  getPublicTherapistProfile,
};