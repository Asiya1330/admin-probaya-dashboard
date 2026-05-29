"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/users";
import type { AiScoreSuggestion } from "@/types/admin.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const MOCK_SCORES: Record<string, AiScoreSuggestion> = {
  glycerin: {
    impact_score: 1,
    confidence: "high",
    reasoning:
      "Glycerin is a well-studied humectant generally considered microbiome-neutral with moisturizing benefits.",
    classification: "Beneficial",
    plain_english_summary: "Helps retain moisture without disrupting skin flora.",
  },
  phenoxyethanol: {
    impact_score: -1,
    confidence: "medium",
    reasoning:
      "Phenoxyethanol is a common preservative that may disrupt microbial balance at higher concentrations.",
    classification: "Harmful",
    plain_english_summary: "Preservative that can mildly affect microbial diversity.",
  },
};

export async function scoreIngredientWithAI(
  ingredientName: string,
): Promise<ActionResult<AiScoreSuggestion>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const normalized = ingredientName.toLowerCase().trim();

  if (apiKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 512,
          system: `You are an ingredient scoring assistant. Score ingredients for microbiome impact using scores -2, -1, 0, +1, or +2. Return JSON only with keys: impact_score (number), confidence (high|medium|low), reasoning (string), classification (Beneficial|Harmful|Neutral|No Data), plain_english_summary (string).`,
          messages: [
            {
              role: "user",
              content: `Score this INCI ingredient: ${ingredientName}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          content: Array<{ type: string; text: string }>;
        };
        const text = payload.content.find((c) => c.type === "text")?.text;
        if (text) {
          const parsed = JSON.parse(text) as AiScoreSuggestion;
          return { success: true, data: parsed };
        }
      }
    } catch {
      // Fall through to mock
    }
  }

  const mock =
    MOCK_SCORES[normalized] ?? {
      impact_score: 0,
      confidence: "low",
      reasoning: `Limited data available for ${ingredientName}. Manual review recommended.`,
      classification: "Neutral",
      plain_english_summary: "Insufficient evidence for a strong microbiome impact assessment.",
    };

  return { success: true, data: mock };
}

export async function approveIngredientScore(
  inciName: string,
  ingredientName: string,
  suggestion: AiScoreSuggestion,
): Promise<ActionResult<{ ingredient_id: string }>> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("ingredients")
    .select("ingredient_id")
    .eq("inci_name", inciName)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("ingredients")
      .update({
        impact_score: String(suggestion.impact_score),
        classification: suggestion.classification,
        plain_english_summary: suggestion.plain_english_summary,
        notes: suggestion.reasoning,
        evidence_strength: suggestion.confidence,
      })
      .eq("ingredient_id", existing.ingredient_id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/ingredients");
    return { success: true, data: { ingredient_id: existing.ingredient_id } };
  }

  const { data, error } = await admin
    .from("ingredients")
    .insert({
      inci_name: inciName,
      ingredient_name: ingredientName,
      impact_score: String(suggestion.impact_score),
      classification: suggestion.classification,
      plain_english_summary: suggestion.plain_english_summary,
      notes: suggestion.reasoning,
      evidence_strength: suggestion.confidence,
    })
    .select("ingredient_id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/ingredients");
  return { success: true, data: { ingredient_id: data.ingredient_id } };
}
