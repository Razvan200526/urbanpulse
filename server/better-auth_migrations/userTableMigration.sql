-- Drop the broken enum that TypeORM created, revert role to plain text
ALTER TABLE "user" ALTER COLUMN "role" TYPE text USING role::text;
DROP TYPE IF EXISTS "public"."user_role_enum";

-- Remove the stale text columns that are now handled by relation tables
ALTER TABLE "user" DROP COLUMN IF EXISTS "skills";
ALTER TABLE "user" DROP COLUMN IF EXISTS "resources";

-- Fix successfulInteractions — better-auth created it as integer,
-- old TypeORM migration may have left it as float/real
ALTER TABLE "user" ALTER COLUMN "successfulInteractions" TYPE integer
  USING "successfulInteractions"::integer;

-- Ensure defaults exist (better-auth relies on these during insert)
ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user" ALTER COLUMN "trustScore" SET DEFAULT 0;
ALTER TABLE "user" ALTER COLUMN "successfulInteractions" SET DEFAULT 0;
ALTER TABLE "user" ALTER COLUMN "isVerified" SET DEFAULT false;
ALTER TABLE "user" ALTER COLUMN "rememberMe" SET DEFAULT false;
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';
