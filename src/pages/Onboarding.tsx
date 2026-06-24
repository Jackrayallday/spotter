import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Inputs";
import { Select } from "../components/ui/Select";
import { useEffect, useMemo, useState } from "react";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { UserProfile } from "../types";
import { calculateNutritionPlan, deriveNutritionGoal, validateNutritionInputs, type NutritionInputs } from "../lib/nutrition";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const goalOptions = [
  { value: "bulk", label: "Build Muscle (Bulk)" },
  { value: "cut", label: "Lose Fat (Cut)" },
  { value: "recomp", label: "Body Recomposition" },
  { value: "strength", label: "Build Strength" },
  { value: "endurance", label: "Improve Endurance" },
];

const experienceOptions = [
  { value: "beginner", label: "Beginner (0-1 years)" },
  { value: "intermediate", label: "Intermediate (1-3 years)" },
  { value: "advanced", label: "Advanced (3+ years)" },
];

const daysOptions = ["2", "3", "4", "5", "6"].map((value) => ({ value, label: `${value} days per week` }));
const sessionOptions = ["30", "45", "60", "90"].map((value) => ({ value, label: `${value} minutes` }));
const equipmentOptions = [
  { value: "full_gym", label: "Full Gym Access" },
  { value: "home", label: "Home Gym" },
  { value: "dumbbells", label: "Dumbbells Only" },
];
const splitOptions = [
  { value: "full_body", label: "Full Body" },
  { value: "upper_lower", label: "Upper/Lower Split" },
  { value: "ppl", label: "Push/Pull/Legs" },
  { value: "custom", label: "Let Spotter decide" },
];
const sexOptions = [{ value: "female", label: "Female" }, { value: "male", label: "Male" }];
const activityOptions = [
  { value: "sedentary", label: "Mostly sitting / little exercise" },
  { value: "light", label: "Light activity (1-3 days per week)" },
  { value: "moderate", label: "Moderate activity (3-5 days per week)" },
  { value: "very_active", label: "Very active (6-7 days per week)" },
  { value: "extra_active", label: "Physical job plus hard training" },
];
const paceOptions = [
  { value: "gentle", label: "Gentle" },
  { value: "steady", label: "Steady" },
  { value: "faster", label: "Faster" },
];

const initialFormData = {
  goal: "bulk", experience: "intermediate", daysPerWeek: "4", sessionLength: "60", equipment: "full_gym", injuries: "", preferredSplit: "upper_lower",
  age: "", calculationSex: "female", heightFeet: "", heightInches: "", weightPounds: "", activityLevel: "moderate", desiredPace: "steady",
};

export default function Onboarding() {
  const { user, saveProfile, generatePlan } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [step, setStep] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [error, setError] = useState("");
  const [nutritionErrors, setNutritionErrors] = useState<Partial<Record<keyof NutritionInputs, string>>>({});
  const navigate = useNavigate();

  const nutritionGoal = deriveNutritionGoal(formData.goal);
  const nutritionInputs = useMemo<NutritionInputs>(() => ({
    age: Number(formData.age), calculationSex: formData.calculationSex as NutritionInputs["calculationSex"],
    heightFeet: Number(formData.heightFeet), heightInches: Number(formData.heightInches), weightPounds: Number(formData.weightPounds),
    activityLevel: formData.activityLevel as NutritionInputs["activityLevel"], nutritionGoal,
    desiredPace: nutritionGoal === "maintenance" ? null : formData.desiredPace as NutritionInputs["desiredPace"],
  }), [formData, nutritionGoal]);
  const caloriePreview = Object.keys(validateNutritionInputs(nutritionInputs)).length === 0 ? calculateNutritionPlan(nutritionInputs) : null;

  useEffect(() => {
    if (!user) return;
    async function loadProfile() {
      try {
        const profile = await api.getProfile(user.id);
        setFormData({
          goal: profile.goal, experience: profile.experience, daysPerWeek: String(profile.daysPerWeek), sessionLength: String(profile.sessionLength),
          equipment: profile.equipment, injuries: profile.injuries || "", preferredSplit: profile.preferredSplit,
          age: String(profile.age ?? ""), calculationSex: profile.calculationSex ?? "female", heightFeet: String(profile.heightFeet ?? ""),
          heightInches: String(profile.heightInches ?? ""), weightPounds: String(profile.weightPounds ?? ""),
          activityLevel: profile.activityLevel ?? "moderate", desiredPace: profile.desiredPace ?? "steady",
        });
        setHasExistingProfile(true);
      } catch (loadError) {
        if (!(loadError instanceof Error) || loadError.message !== "Profile not found") setError("Unable to load your saved profile. You can still complete the form below.");
      } finally { setIsProfileLoading(false); }
    }
    loadProfile();
  }, [user]);

  function updateForm(field: keyof typeof initialFormData, value: string) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  function continueToNutrition(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setStep(2);
  }

  async function handleQuestionnaire(event: React.FormEvent) {
    event.preventDefault();
    const validationErrors = validateNutritionInputs(nutritionInputs);
    setNutritionErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    const nutritionPlan = calculateNutritionPlan(nutritionInputs);
    const profile: Omit<UserProfile, "userId" | "updatedAt"> = {
      goal: formData.goal as UserProfile["goal"], experience: formData.experience as UserProfile["experience"], daysPerWeek: Number(formData.daysPerWeek),
      sessionLength: Number(formData.sessionLength), equipment: formData.equipment as UserProfile["equipment"], injuries: formData.injuries || undefined,
      preferredSplit: formData.preferredSplit as UserProfile["preferredSplit"], ...nutritionInputs, ...nutritionPlan,
    };
    try {
      setError("");
      await saveProfile(profile);
      setIsGenerating(true);
      await generatePlan();
      navigate("/profile");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save profile");
    } finally { setIsGenerating(false); }
  }

  return <div className="min-h-screen pt-24 pb-12 px-6"><div className="max-w-xl mx-auto">
    {isProfileLoading ? <Card variant="bordered" className="py-16 text-center"><Loader2 className="w-12 h-12 text-[var(--color-accent)] mx-auto mb-6 animate-spin" /><h1 className="text-2xl font-bold mb-2">Loading Your Profile</h1></Card>
      : !isGenerating ? <Card variant="bordered">
        <div className="mb-6"><p className="text-sm text-[var(--color-muted)] mb-2">Step {step} of 2</p><h1 className="text-2xl font-bold mb-2">{step === 1 ? (hasExistingProfile ? "Update Your Profile" : "Tell Us About Yourself") : "Build Your Calorie Plan"}</h1>
          <p className="text-[var(--color-muted)]">{step === 1 ? "Help us create the right training plan for you." : "We’ll use these details to set a starting calorie target."}</p></div>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        {step === 1 ? <form onSubmit={continueToNutrition} className="space-y-5">
          <Select id="goal" label="What’s your primary goal?" options={goalOptions} value={formData.goal} onChange={(event) => updateForm("goal", event.target.value)} />
          <Select id="experience" label="What is your training experience?" options={experienceOptions} value={formData.experience} onChange={(event) => updateForm("experience", event.target.value)} />
          <div className="grid grid-cols-2 gap-4"><Select id="daysPerWeek" label="Workout days per week" options={daysOptions} value={formData.daysPerWeek} onChange={(event) => updateForm("daysPerWeek", event.target.value)} /><Select id="sessionLength" label="Session length" options={sessionOptions} value={formData.sessionLength} onChange={(event) => updateForm("sessionLength", event.target.value)} /></div>
          <Select id="equipment" label="What equipment do you have access to?" options={equipmentOptions} value={formData.equipment} onChange={(event) => updateForm("equipment", event.target.value)} />
          <Select id="preferredSplit" label="What is your preferred training split?" options={splitOptions} value={formData.preferredSplit} onChange={(event) => updateForm("preferredSplit", event.target.value)} />
          <Textarea id="injuries" label="Any injuries or limitations? (optional)" placeholder="Lower back issues, shoulder surgery, etc." rows={3} value={formData.injuries} onChange={(event) => updateForm("injuries", event.target.value)} />
          <Button type="submit" className="w-full gap-2">Continue <ArrowRight className="w-4 h-4" /></Button>
        </form> : <form onSubmit={handleQuestionnaire} className="space-y-5">
          <div className="grid grid-cols-2 gap-4"><Input id="age" type="number" inputMode="numeric" min="1" max="120" label="Age" value={formData.age} onChange={(event) => updateForm("age", event.target.value)} error={nutritionErrors.age} required /><Select id="calculationSex" label="Sex" options={sexOptions} value={formData.calculationSex} onChange={(event) => updateForm("calculationSex", event.target.value)} /></div>
          <div><p className="text-sm font-medium text-[var(--color-foreground)] mb-1.5">Height</p><div className="grid grid-cols-2 gap-4"><Input id="heightFeet" type="number" inputMode="numeric" min="3" max="8" label="Feet" value={formData.heightFeet} onChange={(event) => updateForm("heightFeet", event.target.value)} error={nutritionErrors.heightFeet} required /><Input id="heightInches" type="number" inputMode="numeric" min="0" max="11" label="Inches" value={formData.heightInches} onChange={(event) => updateForm("heightInches", event.target.value)} error={nutritionErrors.heightInches} required /></div></div>
          <Input id="weightPounds" type="number" inputMode="decimal" min="70" max="700" step="0.1" label="Current weight (lb)" value={formData.weightPounds} onChange={(event) => updateForm("weightPounds", event.target.value)} error={nutritionErrors.weightPounds} required />
          <Select id="activityLevel" label="Usual daily activity" options={activityOptions} value={formData.activityLevel} onChange={(event) => updateForm("activityLevel", event.target.value)} />
          {nutritionGoal === "maintenance" ? <p className="rounded-xl bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted)]">Your {formData.goal === "recomp" ? "recomposition" : formData.goal} goal uses an estimated maintenance calorie target.</p> : <Select id="desiredPace" label={nutritionGoal === "cut" ? "Fat-loss pace" : "Weight-gain pace"} options={paceOptions} value={formData.desiredPace} onChange={(event) => updateForm("desiredPace", event.target.value)} error={nutritionErrors.desiredPace} />}
          {caloriePreview && <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"><p className="text-sm text-[var(--color-muted)]">Your starting calorie target</p><p className="mt-1 text-3xl font-bold">{caloriePreview.targetKcal.toLocaleString()} kcal/day</p><div className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><p className="text-[var(--color-muted)]">Estimated maintenance</p><p className="font-medium">{caloriePreview.tdeeKcal.toLocaleString()} kcal/day</p></div><div><p className="text-[var(--color-muted)]">Estimated BMR</p><p className="font-medium">{caloriePreview.bmrKcal.toLocaleString()} kcal/day</p></div></div></div>}
          <div className="flex gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button><Button type="submit" className="flex-1 gap-2">{hasExistingProfile ? "Update & Generate Plan" : "Generate My Plan"} <ArrowRight className="w-4 h-4" /></Button></div>
        </form>}
      </Card> : <Card variant="bordered" className="text-center py-16"><Loader2 className="w-12 h-12 text-[var(--color-accent)] mx-auto mb-6 animate-spin" /><h1 className="text-2xl font-bold mb-2">Creating Your Plan</h1><p className="text-[var(--color-muted)]">Our AI is building your personalized training program...</p></Card>}
  </div></div>;
}
