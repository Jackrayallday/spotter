import { describe, expect, it } from "vitest";
import { calculateNutritionPlan, deriveNutritionGoal, validateNutritionInputs, type NutritionInputs } from "./nutrition";

const maintenanceInputs: NutritionInputs = {
  age: 30,
  calculationSex: "female",
  heightFeet: 5,
  heightInches: 5,
  weightPounds: 143,
  activityLevel: "moderate",
  nutritionGoal: "maintenance",
  desiredPace: null,
};

describe("calculateNutritionPlan", () => {
  it("converts U.S. measurements before calculating the female Mifflin–St Jeor estimate", () => {
    expect(calculateNutritionPlan(maintenanceInputs)).toEqual({
      bmrKcal: 1370,
      tdeeKcal: 2123,
      dailyAdjustmentKcal: 0,
      targetKcal: 2125,
    });
  });

  it("applies the requested cut pace and rounds the target to 25 kcal", () => {
    expect(calculateNutritionPlan({
      age: 30, calculationSex: "male", heightFeet: 5, heightInches: 10, weightPounds: 180,
      activityLevel: "moderate", nutritionGoal: "cut", desiredPace: "steady",
    })).toMatchObject({ bmrKcal: 1783, tdeeKcal: 2763, dailyAdjustmentKcal: -450, targetKcal: 2325 });
  });

  it("adds calories for a bulk", () => {
    const plan = calculateNutritionPlan({ ...maintenanceInputs, nutritionGoal: "bulk", desiredPace: "faster" });
    expect(plan.dailyAdjustmentKcal).toBeGreaterThan(0);
    expect(plan.targetKcal).toBeGreaterThan(plan.tdeeKcal);
  });
});

describe("deriveNutritionGoal", () => {
  it("keeps cut and bulk aligned with their calorie direction", () => {
    expect(deriveNutritionGoal("cut")).toBe("cut");
    expect(deriveNutritionGoal("bulk")).toBe("bulk");
  });

  it("uses maintenance for recomp, strength, and endurance", () => {
    expect(deriveNutritionGoal("recomp")).toBe("maintenance");
    expect(deriveNutritionGoal("strength")).toBe("maintenance");
    expect(deriveNutritionGoal("endurance")).toBe("maintenance");
  });
});

describe("validateNutritionInputs", () => {
  it("requires inches in the normal 0–11 range and a pace for cut or bulk", () => {
    const errors = validateNutritionInputs({ ...maintenanceInputs, heightInches: 12, nutritionGoal: "cut", desiredPace: null });
    expect(errors.heightInches).toBeDefined();
    expect(errors.desiredPace).toBeDefined();
  });
});
