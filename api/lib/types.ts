export interface UserProfile {
  goal: string;
  experience: string;
  days_per_week: number;
  session_length: number;
  equipment: string;
  injuries?: string | null;
  preferred_split: string;
  age?: number | null;
  calculation_sex?: "female" | "male" | null;
  height_feet?: number | null;
  height_inches?: number | null;
  weight_pounds?: number | null;
  activity_level?: string | null;
  nutrition_goal?: string | null;
  desired_pace?: string | null;
  bmr_kcal?: number | null;
  tdee_kcal?: number | null;
  daily_adjustment_kcal?: number | null;
  target_kcal?: number | null;
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
  restSeconds: number;
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
  progression: string;
  version: number;
  createdAt: string;
}
