ALTER TABLE "user_profiles"
  ADD COLUMN "age" INTEGER,
  ADD COLUMN "calculation_sex" VARCHAR(10),
  ADD COLUMN "height_feet" INTEGER,
  ADD COLUMN "height_inches" INTEGER,
  ADD COLUMN "weight_pounds" DECIMAL(6, 1),
  ADD COLUMN "activity_level" VARCHAR(20),
  ADD COLUMN "nutrition_goal" VARCHAR(20),
  ADD COLUMN "desired_pace" VARCHAR(20),
  ADD COLUMN "bmr_kcal" INTEGER,
  ADD COLUMN "tdee_kcal" INTEGER,
  ADD COLUMN "daily_adjustment_kcal" INTEGER,
  ADD COLUMN "target_kcal" INTEGER;
