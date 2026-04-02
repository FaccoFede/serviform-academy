-- Fix enum CourseAccessType → TEXT
ALTER TABLE "CompanyCourseAssignment" ALTER COLUMN "accessType" DROP DEFAULT;
ALTER TABLE "UserCourseAssignment"    ALTER COLUMN "accessType" DROP DEFAULT;
ALTER TABLE "CompanyCourseAssignment" ALTER COLUMN "accessType" TYPE TEXT USING "accessType"::text;
ALTER TABLE "UserCourseAssignment"    ALTER COLUMN "accessType" TYPE TEXT USING "accessType"::text;
ALTER TABLE "CompanyCourseAssignment" ALTER COLUMN "accessType" SET DEFAULT 'ACTIVE';
ALTER TABLE "UserCourseAssignment"    ALTER COLUMN "accessType" SET DEFAULT 'ACTIVE';
DROP TYPE IF EXISTS "CourseAccessType";

-- Fix enum CoursePublishState → PublishState
ALTER TABLE "Course" ALTER COLUMN "publishState" DROP DEFAULT;
ALTER TABLE "Course" ALTER COLUMN "publishState" TYPE TEXT USING "publishState"::text;
ALTER TABLE "Course" ALTER COLUMN "publishState" TYPE "PublishState" USING "publishState"::"PublishState";
ALTER TABLE "Course" ALTER COLUMN "publishState" SET DEFAULT 'PUBLISHED'::"PublishState";
DROP TYPE IF EXISTS "CoursePublishState";
