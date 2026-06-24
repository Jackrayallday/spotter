export type CalculationSex = "female" | "male";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active" | "extra_active";
export type NutritionGoal = "cut" | "maintenance" | "bulk";
export type DesiredPace = "gentle" | "steady" | "faster";

export interface NutritionInputs {
  age: number;
  calculationSex: CalculationSex;
  heightFeet: number;
  heightInches: number;
  weightPounds: number;
  activityLevel: ActivityLevel;
  nutritionGoal: NutritionGoal;
  desiredPace: DesiredPace | null;
}

export interface NutritionPlan {
  bmrKcal: number;
  tdeeKcal: number;
  dailyAdjustmentKcal: number;
  targetKcal: number;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const PACE_PERCENTAGES: Record<Exclude<NutritionGoal, "maintenance">, Record<DesiredPace, number>> = {
  cut: { gentle: 0.25, steady: 0.5, faster: 0.75 },
  bulk: { gentle: 0.125, steady: 0.25, faster: 0.5 },
};

export function deriveNutritionGoal(trainingGoal: string): NutritionGoal {
  if (trainingGoal === "cut") return "cut";
  if (trainingGoal === "bulk") return "bulk";
  return "maintenance";
}

export function calculateNutritionPlan(inputs: NutritionInputs): NutritionPlan {
  const heightCm = (inputs.heightFeet * 12 + inputs.heightInches) * 2.54;
  const weightKg = inputs.weightPounds * 0.45359237;
  const sexAdjustment = inputs.calculationSex === "female" ? -161 : 5;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * inputs.age + sexAdjustment;
  const tdee = bmr * ACTIVITY_MULTIPLIERS[inputs.activityLevel];

  let dailyAdjustment = 0;
  if (inputs.nutritionGoal !== "maintenance" && inputs.desiredPace) {
    const weeklyChangePounds = inputs.weightPounds
      * (PACE_PERCENTAGES[inputs.nutritionGoal][inputs.desiredPace] / 100);
    dailyAdjustment = weeklyChangePounds * 3500 / 7;
    if (inputs.nutritionGoal === "cut") dailyAdjustment *= -1;
  }

  return {
    bmrKcal: Math.round(bmr),
    tdeeKcal: Math.round(tdee),
    dailyAdjustmentKcal: Math.round(dailyAdjustment),
    targetKcal: roundToNearest25(tdee + dailyAdjustment),
  };
}

export function validateNutritionInputs(inputs: NutritionInputs): Partial<Record<keyof NutritionInputs, string>> {
  const errors: Partial<Record<keyof NutritionInputs, string>> = {};
  if (inputs.calculationSex !== "female" && inputs.calculationSex !== "male") errors.calculationSex = "Choose female or male.";
  if (!Number.isInteger(inputs.age) || inputs.age < 1 || inputs.age > 120) errors.age = "Enter a valid age.";
  if (!Number.isInteger(inputs.heightFeet) || inputs.heightFeet < 3 || inputs.heightFeet > 8) errors.heightFeet = "Enter a valid height in feet.";
  if (!Number.isInteger(inputs.heightInches) || inputs.heightInches < 0 || inputs.heightInches > 11) errors.heightInches = "Inches must be between 0 and 11.";
  if (!Number.isFinite(inputs.weightPounds) || inputs.weightPounds < 70 || inputs.weightPounds > 700) errors.weightPounds = "Enter a valid weight in pounds.";
  if (!(inputs.activityLevel in ACTIVITY_MULTIPLIERS)) errors.activityLevel = "Choose your usual activity level.";
  if (inputs.nutritionGoal !== "cut" && inputs.nutritionGoal !== "maintenance" && inputs.nutritionGoal !== "bulk") errors.nutritionGoal = "Choose a nutrition goal.";
  if (inputs.desiredPace && inputs.desiredPace !== "gentle" && inputs.desiredPace !== "steady" && inputs.desiredPace !== "faster") errors.desiredPace = "Choose a valid pace.";
  if (inputs.nutritionGoal !== "maintenance" && !inputs.desiredPace) errors.desiredPace = "Choose a pace for your goal.";
  return errors;
}

function roundToNearest25(value: number): number {
  return Math.round(value / 25) * 25;
}
