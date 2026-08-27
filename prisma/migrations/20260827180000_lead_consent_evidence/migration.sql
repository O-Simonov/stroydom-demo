-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "consentGiven" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lead" ADD COLUMN "consentTimestamp" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "consentDocumentVersion" TEXT;
