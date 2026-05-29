"use client";

import { useRouter } from "next/navigation";
import { useTransition, type JSX } from "react";
import { toast } from "sonner";

import {
  createIngredient,
  updateIngredient,
} from "@/actions/ingredients.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Ingredient } from "@/types/admin.types";

type IngredientFormProps = {
  ingredient?: Ingredient;
};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const IngredientForm = ({ ingredient }: IngredientFormProps): JSX.Element => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      ingredient_name: String(formData.get("ingredient_name") ?? ""),
      inci_name: String(formData.get("inci_name") ?? ""),
      impact_score: String(formData.get("impact_score") ?? "") || null,
      classification: String(formData.get("classification") ?? "") || null,
      plain_english_summary:
        String(formData.get("plain_english_summary") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    };

    startTransition(async (): Promise<void> => {
      const result = ingredient
        ? await updateIngredient(ingredient.ingredient_id, payload)
        : await createIngredient(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(ingredient ? "Ingredient updated" : "Ingredient created");
      router.push("/ingredients");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="ingredient_name">Ingredient Name</Label>
        <Input
          id="ingredient_name"
          name="ingredient_name"
          defaultValue={ingredient?.ingredient_name ?? ""}
          required
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inci_name">INCI Name</Label>
        <Input
          id="inci_name"
          name="inci_name"
          defaultValue={ingredient?.inci_name ?? ""}
          required
          className="bg-background"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="impact_score">Impact Score</Label>
          <select
            id="impact_score"
            name="impact_score"
            defaultValue={ingredient?.impact_score ?? ""}
            className={selectClassName}
          >
            <option value="">Select score</option>
            {["-2", "-1", "0", "1", "2"].map((score) => (
              <option key={score} value={score}>
                {score}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="classification">Classification</Label>
          <select
            id="classification"
            name="classification"
            defaultValue={ingredient?.classification ?? ""}
            className={selectClassName}
          >
            <option value="">Select classification</option>
            {["Beneficial", "Harmful", "Neutral", "No Data"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="plain_english_summary">Plain English Summary</Label>
        <Input
          id="plain_english_summary"
          name="plain_english_summary"
          defaultValue={ingredient?.plain_english_summary ?? ""}
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          name="notes"
          defaultValue={ingredient?.notes ?? ""}
          className="bg-background"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : ingredient ? "Save Changes" : "Create Ingredient"}
        </Button>
        <Button type="button" variant="outline" onClick={(): void => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
