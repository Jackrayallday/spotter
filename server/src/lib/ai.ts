import OpenAi from "openai";
import dotenv from "dotenv";
import { jsonrepair } from "jsonrepair";
import { TrainingPlan, UserProfile } from "../../types";

dotenv.config();

const PLAN_MODELS = [
  "openai/gpt-oss-20b:free",
];

const PLAN_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "training_plan",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["overview", "weeklySchedule", "progression"],
      properties: {
        overview: {
          type: "object",
          additionalProperties: false,
          required: ["goal", "frequency", "split", "notes"],
          properties: {
            goal: { type: "string" },
            frequency: { type: "string" },
            split: { type: "string" },
            notes: { type: "string" },
          },
        },
        weeklySchedule: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["day", "focus", "exercises"],
            properties: {
              day: { type: "string" },
              focus: { type: "string" },
              exercises: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "sets", "reps", "restSeconds", "rpe", "notes", "alternatives"],
                  properties: {
                    name: { type: "string" },
                    sets: { type: "number" },
                    reps: { type: "string" },
                    restSeconds: { type: "number" },
                    rpe: { type: "number" },
                    notes: { type: "string" },
                    alternatives: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        progression: { type: "string" },
      },
    },
  },
} as const;

export async function generateTrainingPlan(profile: UserProfile | Record<string, any>,
): Promise<Omit<TrainingPlan, "id" | "userId" | "version" | "createdAt">>{

  //First Normalize Data
  const normalizedProfile: UserProfile = {
    goal: profile.goal || "bulk",
    experience: profile.experience || "intermediate",
    days_per_week: profile.days_per_week || 4,
    session_length: profile.session_length || 60,
    equipment: profile.equipment || "full_gym",
    injuries: profile.injuries || null,
    preferred_split: profile.preferred_split || "upper_lower",
  };

  const apiKey = process.env.OPEN_ROUTER_KEY;

  if (!apiKey) {
    throw new Error("OPEN_ROUTER_KEY is not set in env")
  }

  const openai = new OpenAi({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      "HTTP-Referer": process.env.BASE_URL || "http://localhost:3001",
      "X-Title": "Spotter Plan Generator",
    },
  });

// Now build the prompt
  const prompt = buildPrompt(normalizedProfile);

  try{
    let lastError: Error | null = null;

    for (const [index, model] of PLAN_MODELS.entries()) {
      const attempt = index + 1;

      console.log(
        `[AI] Request diagnostics (attempt ${attempt}):`,
        JSON.stringify(
          {
            model,
            temperature: 0.7,
            responseFormat: "json_schema",
            profile: normalizedProfile,
          },
          null,
          2,
        ),
      );

      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: "You are an expert fitness trainer and program designer. You must respond with valid JSON only. Do not include any markdown, reasoning, or additional text.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: PLAN_RESPONSE_FORMAT as any,
        });

        const content = completion.choices[0].message.content;
        console.log(`[AI] Raw model response (attempt ${attempt}):`, content);
        console.log(
          `[AI] Response diagnostics (attempt ${attempt}):`,
          JSON.stringify(
            {
              id: completion.id,
              model: completion.model,
              provider: (completion as unknown as { provider?: unknown }).provider,
              finishReason: completion.choices[0]?.finish_reason,
              refusal: completion.choices[0]?.message?.refusal,
              usage: completion.usage,
            },
            null,
            2,
          ),
        );

        if (!content) {
          lastError = new Error("No content in AI response");
          continue;
        }

        let planData: unknown;

        try {
          planData = JSON.parse(content);
        } catch {
          console.warn(`[AI] Repairing malformed JSON from attempt ${attempt}.`);
          planData = JSON.parse(jsonrepair(content));
        }

        if (!isValidPlanResponse(planData)) {
          lastError = new Error("AI response did not contain a complete training plan");
          continue;
        }

        return formatPlanResponse(planData, normalizedProfile);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unable to parse AI response");
        console.warn(
          index < PLAN_MODELS.length - 1
            ? `[AI] Attempt ${attempt} failed; trying the next fallback model.`
            : `[AI] Attempt ${attempt} failed.`,
          lastError.message,
        );
      }
    }

    throw lastError || new Error("Unable to generate a complete training plan");

  } catch (error) {
    console.error("Error generating training plan:", error);
    throw error;
  }
}

function isValidPlanResponse(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== "object") return false;

  const plan = value as Record<string, any>;
  const overview = plan.overview;

  return (
    typeof plan.progression === "string" &&
    plan.progression.trim().length > 0 &&
    !!overview &&
    typeof overview === "object" &&
    typeof overview.goal === "string" &&
    typeof overview.frequency === "string" &&
    typeof overview.split === "string" &&
    typeof overview.notes === "string" &&
    Array.isArray(plan.weeklySchedule) &&
    plan.weeklySchedule.length > 0 &&
    plan.weeklySchedule.every(
      (day: unknown) =>
        !!day &&
        typeof day === "object" &&
        typeof (day as Record<string, any>).day === "string" &&
        typeof (day as Record<string, any>).focus === "string" &&
        Array.isArray((day as Record<string, any>).exercises) &&
        (day as Record<string, any>).exercises.length > 0 &&
        (day as Record<string, any>).exercises.every(
          (exercise: unknown) =>
            !!exercise &&
            typeof exercise === "object" &&
            typeof (exercise as Record<string, any>).name === "string" &&
            typeof (exercise as Record<string, any>).sets === "number" &&
            typeof (exercise as Record<string, any>).reps === "string" &&
            typeof (exercise as Record<string, any>).restSeconds === "number" &&
            typeof (exercise as Record<string, any>).rpe === "number",
        ),
    )
  );
}


function formatPlanResponse(
  aiResponse: any, 
  profile: UserProfile,
): Omit<TrainingPlan, "id" | "userId" | "version" | "createdAt"> {
  const plan : Omit<TrainingPlan, "id" | "userId" | "version" | "createdAt"> = {
    overview: {
      goal: aiResponse.overview?.goal || `Customized ${profile.goal} program`,
      frequency: aiResponse.overview?.frequency || `Customized ${profile.days_per_week} days per week`,
      split: aiResponse.overview?.split || profile.preferred_split,
      notes: aiResponse.overview?.notes || 'Follow the program consistently for best results',

    },
    weeklySchedule: (aiResponse.weeklySchedule || []).map((day: any) => ({
      day: day.day || "Day",
      focus: day.focus || 'Full Body',
      exercises: (day.exercises ||[]).map((ex: any) => ({
        name: ex.name || "Exercise",
        sets: ex.sets || 3,
        reps: ex.reps || "8-12",
        restSeconds: ex.restSeconds,
        rpe: ex.rpe || 7,
        notes: ex.notes,
        alternatives: ex.alternatives,
      })),
    })),
    progression: aiResponse.progression || "This went to the fallback text. Your plan is not unique. Contact customer support"
  };
  return plan;
}


function buildPrompt(profile: UserProfile): string {
  const goalMap: Record <string, string> = {
    bulk: "build muscle and gain size",
    cut: "lose fat and maintain muscle",
    recomp: "simultaneously lose fat and build muscle",
    strength: "build maximum strength",
    endurance: "improve cardiovascular endurance and stamina",
  };
  const experienceMap: Record<string, string> = {
    beginner: "beginner (0-1 years of training experience)",
    intermediate: "intermediate (1-3 years of training experience)",
    advanced: "advanced (3+ years of training experience)",
  };
  const equipmentMap: Record<string, string> = {
    full_gym: "full gym access with all equipment",
    home: "home gym with limited equipment",
    dumbbells: "only dumbbells available",
  };
  const splitMap: Record<string, string> = {
    full_body: "full body workouts",
    upper_lower: "upper/lower split",
    ppl: "push/pull/legs split",
    custom: "best split for their goals",
  };
  return `Create a personalized ${profile.days_per_week}-day per week training plan for someone with the following profile:
    Goal: ${goalMap[profile.goal] || profile.goal}
    Experience Level: ${experienceMap[profile.experience] || profile.experience}
    Session Length: ${profile.session_length} minutes per session
    Equipment: ${equipmentMap[profile.equipment] || profile.equipment}
    Preferred Split: ${splitMap[profile.preferred_split] || profile.preferred_split}
    ${profile.injuries ? `Injuries/Limitations: ${profile.injuries}` : ""}

    Generate a complete training plan in JSON format with this exact structure:
    {
      "overview": {
        "goal": "brief description of the training goal",
        "frequency": "X days per week",
        "split": "training split name",
        "notes": "important notes about the program (2-3 sentences)"
      },
      "weeklySchedule": [
        {
          "day": "Monday",
          "focus": "muscle group or focus area",
          "exercises": [
            {
              "name": "Exercise Name",
              "sets": 4,
              "reps": "6-8",
              "restSeconds": 120,
              "rpe": 8,
              "notes": "form cues or tips (optional)",
              "alternatives": ["Alternative 1", "Alternative 2"]
            }
          ]
        }
      ],
      "progression": "detailed progression strategy (2-3 sentences explaining how to progress)"
    }

      Requirements:
      - Create exactly ${profile.days_per_week} workout days
      - Each workout should fit within ${profile.session_length} minutes
      - Include 4-6 exercises per workout
      - RPE (Rate of Perceived Exertion) should be 6-9
      - Use restSeconds as a number of seconds (for example, 90), never a text value like "90 sec"
      - Include compound movements for beginners/intermediate, advanced can have more isolation
      - Match the preferred split type: ${profile.preferred_split}
      - ${profile.injuries ? `Avoid exercises that could aggravate: ${profile.injuries}` : ""}
      - Provide exercise alternatives where appropriate
      - Make it progressive and suitable for ${experienceMap[profile.experience] || profile.experience} level
      
      Return ONLY the JSON object (no markdown, no extra text).
      `;
}
