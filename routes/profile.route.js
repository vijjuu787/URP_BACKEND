const express = require("express");
const router = express.Router();
const { prisma } = require("../prisma/index.js");
const requireAuth = require("../middleware/AuthMiddleware.js");

// GET current user's profile (authenticated) OR public profile
router.get("/", async (req, res) => {
  try {
    // Check if user is authenticated
    const token = req.cookies.token;
    
    if (token) {
      // Authenticated request - get own profile
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Invalid authentication" });
      }

      console.log("Fetching profile for authenticated user:", userId);

      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        include: {
          experiences: {
            orderBy: { createdAt: "desc" },
          },
          educations: {
            orderBy: { createdAt: "desc" },
          },
          skills: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (!profile) {
        return res.status(404).json({
          error: "Profile not found for authenticated user",
        });
      }

      return res.json({
        message: "Profile retrieved successfully",
        data: profile,
      });
    } else {
      // Not authenticated - return error
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
  } catch (err) {
    console.error("Error in GET /:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET user profile by userId (public endpoint for viewing any profile)
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("Fetching profile for user:", userId);

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        experiences: {
          orderBy: { createdAt: "desc" },
        },
        educations: {
          orderBy: { createdAt: "desc" },
        },
        skills: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    res.json({
      message: "Profile retrieved successfully",
      data: profile,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET profile by candidateId (path parameter)
router.get("/candidate/:candidateId", async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Validate candidateId is provided
    if (!candidateId) {
      return res.status(400).json({
        error: "candidateId is required",
      });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: candidateId },
      include: {
        experiences: {
          orderBy: { createdAt: "desc" },
        },
        educations: {
          orderBy: { createdAt: "desc" },
        },
        skills: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found for this candidate",
      });
    }

    res.json({
      message: "Candidate profile retrieved successfully",
      data: profile,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE/UPDATE user profile
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      headline,
      summary,
      location,
      phone,
      experiences,
      educations,
      skills,
    } = req.body;

    // Upsert profile (create if doesn't exist, update if does)
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        headline,
        summary,
        location,
        phone,
        updatedAt: new Date(),
      },
      create: {
        userId,
        headline,
        summary,
        location,
        phone,
      },
      include: {
        experiences: true,
        educations: true,
        skills: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Update experiences if provided
    if (experiences && Array.isArray(experiences) && experiences.length > 0) {
      // Delete existing experiences
      await prisma.experience.deleteMany({
        where: { profileId: profile.id },
      });

      // Create new experiences
      const createdExperiences = await Promise.all(
        experiences.map((exp) =>
          prisma.experience.create({
            data: {
              profileId: profile.id,
              company: exp.company,
              role: exp.role,
              location: exp.location || null,
              startDate: exp.startDate || null,
              endDate: exp.endDate || null,
              description: exp.description || null,
            },
          }),
        ),
      );
      profile.experiences = createdExperiences;
    }

    // Update educations if provided
    if (educations && Array.isArray(educations) && educations.length > 0) {
      // Delete existing educations
      await prisma.education.deleteMany({
        where: { profileId: profile.id },
      });

      // Create new educations
      const createdEducations = await Promise.all(
        educations.map((edu) =>
          prisma.education.create({
            data: {
              profileId: profile.id,
              degree: edu.degree,
              institution: edu.institution,
              location: edu.location || null,
              graduationYear: edu.graduationYear || null,
            },
          }),
        ),
      );
      profile.educations = createdEducations;
    }

    // Update skills if provided
    if (skills) {
      const skillsData = {
        frontend: skills.frontend || [],
        backend: skills.backend || [],
        tools: skills.tools || [],
      };

      const updatedSkills = await prisma.profileSkills.upsert({
        where: { profileId: profile.id },
        update: skillsData,
        create: {
          profileId: profile.id,
          ...skillsData,
        },
      });
      profile.skills = updatedSkills;
    }

    res.status(201).json({
      message: "Profile created/updated successfully",
      data: profile,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE specific profile field
router.patch("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Ensure profile exists
    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: { userId },
      });
    }

    // Update profile with provided fields
    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: updateData,
      include: {
        experiences: {
          orderBy: { createdAt: "desc" },
        },
        educations: {
          orderBy: { createdAt: "desc" },
        },
        skills: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json({
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ADD experience
router.post("/experience", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, role, location, startDate, endDate, description } =
      req.body;

    // Verify profile exists
    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: { userId },
      });
    }

    const experience = await prisma.experience.create({
      data: {
        profileId: profile.id,
        company,
        role,
        location: location || null,
        startDate: startDate || null,
        endDate: endDate || null,
        description: description || null,
      },
    });

    res.status(201).json({
      message: "Experience added successfully",
      data: experience,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE experience
router.delete("/experience/:experienceId", requireAuth, async (req, res) => {
  try {
    const { experienceId } = req.params;
    const userId = req.user.id;

    // Verify experience belongs to user
    const experience = await prisma.experience.findUnique({
      where: { id: experienceId },
      include: { profile: true },
    });

    if (!experience || experience.profile.userId !== userId) {
      return res.status(403).json({
        error: "Not authorized to delete this experience",
      });
    }

    await prisma.experience.delete({
      where: { id: experienceId },
    });

    res.json({
      message: "Experience deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ADD education
router.post("/education", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { degree, institution, location, graduationYear } = req.body;

    // Verify profile exists
    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: { userId },
      });
    }

    const education = await prisma.education.create({
      data: {
        profileId: profile.id,
        degree,
        institution,
        location: location || null,
        graduationYear: graduationYear || null,
      },
    });

    res.status(201).json({
      message: "Education added successfully",
      data: education,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE education
router.delete("/education/:educationId", requireAuth, async (req, res) => {
  try {
    const { educationId } = req.params;
    const userId = req.user.id;

    // Verify education belongs to user
    const education = await prisma.education.findUnique({
      where: { id: educationId },
      include: { profile: true },
    });

    if (!education || education.profile.userId !== userId) {
      return res.status(403).json({
        error: "Not authorized to delete this education",
      });
    }

    await prisma.education.delete({
      where: { id: educationId },
    });

    res.json({
      message: "Education deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE skills
router.post("/skills", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { frontend, backend, tools } = req.body;

    // Verify profile exists
    let profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: { userId },
      });
    }

    const skills = await prisma.profileSkills.upsert({
      where: { profileId: profile.id },
      update: {
        frontend: frontend || [],
        backend: backend || [],
        tools: tools || [],
      },
      create: {
        profileId: profile.id,
        frontend: frontend || [],
        backend: backend || [],
        tools: tools || [],
      },
    });

    res.status(201).json({
      message: "Skills updated successfully",
      data: skills,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
