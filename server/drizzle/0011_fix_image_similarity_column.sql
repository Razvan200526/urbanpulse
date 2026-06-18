DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'pet_match'
      AND column_name  = 'imageSimilarity'
  ) THEN
    ALTER TABLE "pet_match" ADD COLUMN "imageSimilarity" double precision NOT NULL;
  END IF;
END $$;
