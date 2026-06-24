import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import {
  Calendar,
  Dumbbell,
  RefreshCcw,
  Loader2,
  Pencil,
  TrendingUp,
  Flame,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { PlanDisplay } from "../components/plan/PlanDisplay.tsx";
import { api } from "../lib/api";

export default function Profile() {
  const { user, isLoading, isPlanLoading, plan, generatePlan } = useAuth();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [targetKcal, setTargetKcal] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    let isCurrent = true;

    api.getProfile(user.id)
      .then((profile) => {
        if (isCurrent) setTargetKcal(profile.targetKcal ?? null);
      })
      .catch(() => {
        if (isCurrent) setTargetKcal(null);
      });

    return () => { isCurrent = false; };
  }, [user]);

  if (isLoading || isPlanLoading) {
    return <div className="min-h-screen" aria-busy="true" />;
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (!plan) {
    return <Navigate to="/onboarding" replace />;
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatSplit(split: string) {
    const labels: Record<string, string> = {
      full_body: "Full Body",
      upper_lower: "Upper/Lower",
      ppl: "Push/Pull/Legs",
    };
    return labels[split] || split.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  async function handleRegenerate() {
    setGenerationError("");
    setIsRegenerating(true);

    try {
      await generatePlan();
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "Unable to regenerate your plan. Please try again.",
      );
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Your Training Plan</h1>
            <p className="text-[var(--color-muted)]">
              Version {plan.version} • Created {formatDate(plan.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => navigate("/onboarding")}
              disabled={isRegenerating}
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCcw className="w-4 h-4" />
              Regenerate Plan
            </Button>
          </div>
        </div>

        {generationError && (
          <p className="mb-6 text-sm text-red-500">{generationError}</p>
        )}

        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <Card variant="bordered" className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Daily Calories</p>
              <p className="font-medium text-sm">
                {targetKcal ? `${targetKcal.toLocaleString()} kcal/day` : "Not set"}
              </p>
            </div>
          </Card>
          <Card variant="bordered" className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Frequency</p>
              <p className="font-medium text-sm">{plan.overview.frequency}</p>
            </div>
          </Card>
          <Card variant="bordered" className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Split</p>
              <p className="font-medium text-sm">{formatSplit(plan.overview.split)}</p>
            </div>
          </Card>
          <Card variant="bordered" className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Version</p>
              <p className="font-medium text-sm">{plan.version}</p>
            </div>
          </Card>
        </div>

        <Card variant="bordered" className="mb-4 p-4">
          <h2 className="font-semibold text-lg mb-2">Training Goal</h2>
          <p className="text-[var(--color-muted)] text-sm leading-relaxed">
            {plan.overview.goal}
          </p>
          <div className="my-3 border-t border-[var(--color-border)]" />
          <h2 className="font-semibold text-lg mb-2">Program Notes</h2>
          <p className="text-[var(--color-muted)] text-sm leading-relaxed">
            {plan.overview.notes}
          </p>
        </Card>

        {/* Weekly Schedule */}
        <h2 className="font-semibold text-xl mb-4 mt-8">Weekly Schedule</h2>
        <PlanDisplay weeklySchedule={plan.weeklySchedule} />

        <Card variant="bordered" className="mt-8 mb-4 p-4">
          <h2 className="font-semibold text-lg mb-2">Progression Strategy</h2>
          <p className="text-[var(--color-muted)] text-sm leading-relaxed">
            {plan.progression}
          </p>
        </Card>
      </div>

      {isRegenerating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          role="status"
          aria-live="polite"
        >
          <Card variant="bordered" className="w-full max-w-md py-16 text-center">
            <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-[var(--color-accent)]" />
            <h2 className="mb-2 text-2xl font-bold">Updating Your Plan</h2>
            <p className="text-[var(--color-muted)]">
              Our AI is creating a new plan using your current profile.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
