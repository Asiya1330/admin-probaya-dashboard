"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState, type JSX } from "react";
import { toast } from "sonner";

import { createIngredient } from "@/actions/ingredients.actions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RequiredLabel } from "@/components/shared/RequiredLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fieldClassName } from "@/lib/form-field-styles";
import {
  formatScoreLabel,
  getScoreBadgeStyle,
} from "@/lib/product-wizard-utils";
import { cn } from "@/lib/utils";
import type {
  NewIngredientDraft,
  WizardIngredient,
} from "@/types/product-wizard.types";

type IngredientSectionProps = {
  title: string;
  dotColor: string;
  badgeClass?: string;
  badgeLabel?: string;
  ingredients: WizardIngredient[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, ingredient: WizardIngredient) => void;
  showExpandForm?: boolean;
};

const CLASSIFICATIONS = ["Beneficial", "Harmful", "Neutral", "No Data"] as const;
const IMPACT_SCORES = ["", "2", "1", "0", "-1", "-2"] as const;
const EVIDENCE = ["Strong", "Moderate", "Weak"] as const;

const NewIngredientForm = ({
  draft,
  onChange,
  onSave,
  isSaving,
}: {
  draft: NewIngredientDraft;
  onChange: (draft: NewIngredientDraft) => void;
  onSave: () => void;
  isSaving: boolean;
}): JSX.Element => (
  <div className="mt-3 space-y-3 rounded-lg border border-border bg-background p-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <RequiredLabel htmlFor="draft_ingredient_name">Ingredient Name</RequiredLabel>
        <Input
          id="draft_ingredient_name"
          value={draft.ingredient_name}
          onChange={(e) => onChange({ ...draft, ingredient_name: e.target.value })}
          className="bg-card"
        />
      </div>
      <div className="space-y-2">
        <RequiredLabel htmlFor="draft_inci_name">INCI Name</RequiredLabel>
        <Input
          id="draft_inci_name"
          value={draft.inci_name}
          onChange={(e) => onChange({ ...draft, inci_name: e.target.value })}
          className={fieldClassName(!draft.inci_name.trim(), "bg-card")}
        />
      </div>
      <div className="space-y-2">
        <Label>Classification</Label>
        <Select
          value={draft.classification}
          onValueChange={(v) => onChange({ ...draft, classification: v })}
        >
          <SelectTrigger className="bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLASSIFICATIONS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Impact Score</Label>
        <Select
          value={draft.impact_score || "blank"}
          onValueChange={(v) =>
            onChange({ ...draft, impact_score: v === "blank" ? "" : v })
          }
        >
          <SelectTrigger className="bg-card">
            <SelectValue placeholder="Leave blank" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blank">Leave blank</SelectItem>
            {IMPACT_SCORES.filter(Boolean).map((s) => (
              <SelectItem key={s} value={s}>
                {Number(s) > 0 ? `+${s}` : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Evidence Strength</Label>
        <Select
          value={draft.evidence_strength || undefined}
          onValueChange={(v) => onChange({ ...draft, evidence_strength: v })}
        >
          <SelectTrigger className="bg-card">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {EVIDENCE.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Conflicting Evidence</Label>
        <Select
          value={draft.conflicting_evidence || undefined}
          onValueChange={(v) => onChange({ ...draft, conflicting_evidence: v })}
        >
          <SelectTrigger className="bg-card">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="space-y-2">
      <Label>Plain English Summary</Label>
      <textarea
        value={draft.plain_english_summary}
        maxLength={300}
        rows={2}
        onChange={(e) =>
          onChange({ ...draft, plain_english_summary: e.target.value })
        }
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
      />
    </div>
    <div className="space-y-2">
      <Label>Notes</Label>
      <textarea
        value={draft.notes}
        rows={2}
        onChange={(e) => onChange({ ...draft, notes: e.target.value })}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
      />
    </div>
    <Button
      type="button"
      size="sm"
      className="btn-success border-0"
      disabled={isSaving || !draft.inci_name.trim() || !draft.ingredient_name.trim()}
      onClick={onSave}
    >
      {isSaving ? (
        <>
          <LoadingSpinner />
          Saving…
        </>
      ) : (
        "Save to ingredients table"
      )}
    </Button>
  </div>
);

export const IngredientSection = ({
  title,
  dotColor,
  badgeClass,
  badgeLabel,
  ingredients,
  onRemove,
  onUpdate,
  showExpandForm = false,
}: IngredientSectionProps): JSX.Element | null => {
  const [savingId, setSavingId] = useState<string | null>(null);

  if (ingredients.length === 0) {
    return null;
  }

  const handleSaveNew = async (item: WizardIngredient): Promise<void> => {
    if (!item.draft) return;

    setSavingId(item.id);
    const result = await createIngredient({
      ingredient_name: item.draft.ingredient_name.trim(),
      inci_name: item.draft.inci_name.trim(),
      classification: item.draft.classification || "No Data",
      plain_english_summary: item.draft.plain_english_summary.trim() || null,
      impact_score: item.draft.impact_score || null,
      evidence_strength: item.draft.evidence_strength || null,
      conflicting_evidence: item.draft.conflicting_evidence || null,
      notes: item.draft.notes.trim() || null,
    });
    setSavingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const saved = result.data;
    const category =
      saved.impact_score !== null && saved.impact_score !== ""
        ? "scored"
        : "unscored";

    onUpdate(item.id, {
      ...item,
      ingredient_id: saved.ingredient_id,
      ingredient_name: saved.ingredient_name,
      inci_name: saved.inci_name,
      impact_score: saved.impact_score,
      classification: saved.classification,
      plain_english_summary: saved.plain_english_summary,
      category,
      draft: undefined,
      expanded: false,
    });
    toast.success(`"${saved.ingredient_name}" added to ingredients`);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <ul className="space-y-2">
        {ingredients.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", dotColor)}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{item.ingredient_name}</p>
                  <p className="text-xs text-muted-foreground">{item.inci_name}</p>
                  {badgeLabel ? (
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full border px-2 py-0.5 text-xs",
                        badgeClass,
                      )}
                    >
                      {badgeLabel}
                    </span>
                  ) : item.category === "scored" ? (
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full border px-2 py-0.5 text-xs",
                        getScoreBadgeStyle(item.impact_score, item.classification),
                      )}
                    >
                      {formatScoreLabel(item.impact_score, item.classification)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {showExpandForm ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      onUpdate(item.id, {
                        ...item,
                        expanded: !item.expanded,
                      })
                    }
                  >
                    {item.expanded ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemove(item.id)}
                >
                  <X className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            {showExpandForm && item.expanded && item.draft ? (
              <NewIngredientForm
                draft={item.draft}
                onChange={(draft) => onUpdate(item.id, { ...item, draft })}
                onSave={() => void handleSaveNew(item)}
                isSaving={savingId === item.id}
              />
            ) : null}
            {showExpandForm && !item.expanded ? (
              <button
                type="button"
                className="mt-2 text-xs text-[#8b5cf6] hover:underline"
                onClick={() => onUpdate(item.id, { ...item, expanded: true })}
              >
                Expand to fill details
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};
