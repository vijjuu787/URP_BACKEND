/*
  Warnings:

  - Added the required column `jobID` to the `assignment_submissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "assignment_submissions" ADD COLUMN     "jobID" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "objective" TEXT,
ALTER COLUMN "totalPoints" DROP NOT NULL;

-- AlterTable
ALTER TABLE "job_postings" ADD COLUMN     "company" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_jobID_fkey" FOREIGN KEY ("jobID") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
