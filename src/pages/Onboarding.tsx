import { RedirectToSignIn, SignedIn } from "@neondatabase/neon-js/auth/react";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Select } from "../components/ui/Select";
import { useState } from "react";

const goalOptions = [
  {value: "bulk", label: "Build Muscle (Bulk)"},
  {value: "cut", label: "Lose Fat (Cut)"},
  {value: "recomp", label: "Body Recomposition"},
  {value: "strength", label: "Build Strength"},
  {value: "endurance", label: "Improve Endurance"},
];

const expereinceOptions = [
  {value: "beginner", label: "Beginner (0-1 years)"},
  {value: "intermediate", label: "Intermediate (1-3 years)"},
  {value: "advanced", label: "Advanced (3+ years)"},
];

const daysOptions = [
  {value: "2", label: "2 days per week"},
  {value: "3", label: "3 days per week"},
  {value: "4", label: "4 days per week"},
  {value: "5", label: "5 days per week"},
  {value: "6", label: "6 days per week"},
];


const sessionOptions = [
  {value: '30', label: '30 minutes'},
  {value: '45', label: '45 minutes'},
  {value: '60', label: '60 minutes'},
  {value: '90', label: '90 minutes'},
];

const equipmentOptions = [
  {value: "full_gym", label: "Full Gym Access"},
  {value: "home", label: "Home Gym"},
  {value: "dumbbells", label: "Dumbbells Only"},
];


const splitOptions = [
  {value: "full_body", label: "Full Body"},
  {value: "upper_lower", label: "Upper/Lower Split"},
  {value: "ppl", label: "Push/Pull/Legs"},
  {value: "custom", label: "Let the System Decide based on your questionaire answers"},
];



export default function Onboarding() {

  const {user} = useAuth()
  const [formData, setFromData] = useState({
    goal: "bulk",
    experience: "intermediate",
    daysPerWeek: "4",
    sessionLength: "60",
    equipment: "full_gym",
    injuries: "",
    preferredSplit: "upper_lower",
  });

  function updateForm(field: string, value: string){
    setFromData((prev) => ({ ...prev, [field]: value}));
  }


  if(!user){
    return <RedirectToSignIn />;
  }
  return (
    <SignedIn>
      <div className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-xl mx-auto">
          {/* Progress Indicator */}

          {/* Step 1: Questionaire */}
          <Card variant="bordered">
            <h1 className="text-2xl font-bold mb-2">Tell Us About Yourself</h1>
            <p className="text-[var(--color-muted)] mb-6">Help us create the perfect plan for you.</p>
            <form>
              <Select 
                id="goal"
                label="What's your primary goal?" 
                options={goalOptions}
                value={formData.goal}
                onChange={(e) => updateForm('goal', e.target.value)}
              />
            </form>
          </Card>

          {/* Step 2: GenAi */}
        </div>
      </div>
    </SignedIn>
    );
}
//40:05