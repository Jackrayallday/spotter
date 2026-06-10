-- CreateTable
CREATE TABLE "training_plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_json" JSONB NOT NULL,
    "plan_text" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "training_plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_training_plans_user_id" ON "training_plan"("user_id");
