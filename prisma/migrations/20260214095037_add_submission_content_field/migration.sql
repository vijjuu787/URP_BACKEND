/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FRONTEND', 'BACKEND', 'FULLSTACK', 'DEVOPS', 'DATA_SCIENCE', 'MOBILE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubmissionFileType" AS ENUM ('ZIP', 'PDF', 'GITHUB', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('REVIEWED', 'IN_PROGRESS', 'REVIEWING', 'DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "ReviewRecommendation" AS ENUM ('HIRE', 'MAYBE', 'REJECT');

-- CreateEnum
CREATE TYPE "EngineerAssignmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "updatedAt",
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "resumeUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "profileImage" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educations" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "location" TEXT,
    "graduationYear" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_skills" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "frontend" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "backend" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryRole" TEXT NOT NULL,
    "secondaryRole" "Role" NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "experienceAndProject" TEXT NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "workType" TEXT,
    "roleType" TEXT,
    "requirements" TEXT,
    "difficulty" "DifficultyLevel" NOT NULL,
    "responsibilities" TEXT,
    "experienceLevel" TEXT,
    "salaryRange" TEXT,
    "points" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "postDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "downloadAssetsUrl" TEXT,
    "downloadAssetsName" TEXT,
    "timeLimitHours" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentStart" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentStart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "assignmentStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "timeTakenMinutes" INTEGER,
    "deadline" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "candidateNotes" TEXT,
    "submissionContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionFile" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" "SubmissionFileType",
    "fileUrl" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_reviews" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "codeQualityScore" INTEGER NOT NULL,
    "logicProblemSolvingScore" INTEGER NOT NULL,
    "bestPracticesScore" INTEGER NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "recommendation" "ReviewRecommendation",
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineer_assignments" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "status" "EngineerAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engineer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_JobAssignments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JobAssignments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_skills_profileId_key" ON "profile_skills"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_userId_key" ON "candidates"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_assignmentId_candidateId_key" ON "assignment_submissions"("assignmentId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_reviews_submissionId_engineerId_key" ON "assignment_reviews"("submissionId", "engineerId");

-- CreateIndex
CREATE UNIQUE INDEX "engineer_assignments_submissionId_engineerId_key" ON "engineer_assignments"("submissionId", "engineerId");

-- CreateIndex
CREATE INDEX "_JobAssignments_B_index" ON "_JobAssignments"("B");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educations" ADD CONSTRAINT "educations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_skills" ADD CONSTRAINT "profile_skills_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentStart" ADD CONSTRAINT "AssignmentStart_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentStart" ADD CONSTRAINT "AssignmentStart_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentStart" ADD CONSTRAINT "AssignmentStart_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionFile" ADD CONSTRAINT "SubmissionFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_reviews" ADD CONSTRAINT "assignment_reviews_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_reviews" ADD CONSTRAINT "assignment_reviews_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_assignments" ADD CONSTRAINT "engineer_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_assignments" ADD CONSTRAINT "engineer_assignments_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_assignments" ADD CONSTRAINT "engineer_assignments_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobAssignments" ADD CONSTRAINT "_JobAssignments_A_fkey" FOREIGN KEY ("A") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobAssignments" ADD CONSTRAINT "_JobAssignments_B_fkey" FOREIGN KEY ("B") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
