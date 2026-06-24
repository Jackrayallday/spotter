export interface User {
    id: string;
    email: string;
    createdAt: string;
}

export interface UserProfile {

  userId: string;
  goal: "cut" | "bulk" | "recomp" | "strength" | "endurance";
  experience: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  sessionLength: number;
  equipment: "full_gym" | "home" | "dumbbells";
  injuries?: string | null;
  preferredSplit: "full_body" | "upper_lower" | "ppl" | "custom";
  age: number;
  calculationSex: "female" | "male";
  heightFeet: number;
  heightInches: number;
  weightPounds: number;
  activityLevel: "sedentary" | "light" | "moderate" | "very_active" | "extra_active";
  nutritionGoal: "cut" | "maintenance" | "bulk";
  desiredPace: "gentle" | "steady" | "faster" | null;
  bmrKcal: number;
  tdeeKcal: number;
  dailyAdjustmentKcal: number;
  targetKcal: number;
  updatedAt: string;
}

export interface PlanOverview {
  goal: string;
  frequency: string;
  split: string;
  notes: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  // Preserves display support for plans generated before restSeconds was introduced.
  rest?: string;
  rpe: number;
  notes?: string;
  alternatives?: string[];
  
}

export interface DaySchedule {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface TrainingPlan {
  id: string;
  userId: string;
  overview: PlanOverview;
  weeklySchedule: DaySchedule[];
  progression : string;
  version: number;
  createdAt: string;
}
