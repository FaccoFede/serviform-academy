-- Migration: add thumbnailUrl to Course
-- Generated: 2026-03-30
-- Run: npx prisma migrate dev --name add_thumbnail_url

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
