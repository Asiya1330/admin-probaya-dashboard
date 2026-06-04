"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition, type JSX } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createIngredient,
  updateIngredient,
} from "@/actions/ingredients.actions";
import { FormFieldError } from "@/components/shared/FormFieldError";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RequiredLabel } from "@/components/shared/RequiredLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fieldClassName } from "@/lib/form-field-styles";
import {
  IMPACT_SCORES,
  INGREDIENT_CLASSIFICATIONS,
  ingredientFormSchema,
  type IngredientFormInput,
} from "@/lib/validators/ingredient.schema";
import { cn } from "@/lib/utils";
import type { Ingredient } from "@/types/admin.types";

type IngredientFormProps = {
  ingredient?: Ingredient;
};

const selectClassName = (invalid: boolean): string =>
  cn(
    "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    fieldClassName(invalid),
  );

const isImpactScore = (
  value: string | null | undefined,
): value is (typeof IMPACT_SCORES)[number] =>
  Boolean(value && IMPACT_SCORES.includes(value as (typeof IMPACT_SCORES)[number]));

const isClassification = (
  value: string | null | undefined,
): value is (typeof INGREDIENT_CLASSIFICATIONS)[number] =>
  Boolean(
    value &&
      INGREDIENT_CLASSIFICATIONS.includes(
        value as (typeof INGREDIENT_CLASSIFICATIONS)[number],
      ),
  );

export const IngredientForm = ({ ingredient }: IngredientFormProps): JSX.Element => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<IngredientFormInput>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      ingredient_name: ingredient?.ingredient_name ?? "",
      inci_name: ingredient?.inci_name ?? "",
      impact_score: isImpactScore(ingredient?.impact_score)
        ? ingredient.impact_score
        : undefined,
      classification: isClassification(ingredient?.classification)
        ? ingredient.classification
        : undefined,
      plain_english_summary: ingredient?.plain_english_summary ?? "",
      notes: ingredient?.notes ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values): void => {
    const payload = {
      ingredient_name: values.ingredient_name,
      inci_name: values.inci_name,
      impact_score: values.impact_score,
      classification: values.classification,
      plain_english_summary: values.plain_english_summary,
      notes: values.notes,
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
  });

  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6"
    >
      <div className="space-y-2">
        <RequiredLabel htmlFor="ingredient_name">Ingredient Name</RequiredLabel>
        <Input
          id="ingredient_name"
          aria-invalid={Boolean(errors.ingredient_name)}
          className={fieldClassName(Boolean(errors.ingredient_name), "bg-background")}
          {...register("ingredient_name")}
        />
        <FormFieldError message={errors.ingredient_name?.message} />
      </div>
      <div className="space-y-2">
        <RequiredLabel htmlFor="inci_name">INCI Name</RequiredLabel>
        <Input
          id="inci_name"
          aria-invalid={Boolean(errors.inci_name)}
          className={fieldClassName(Boolean(errors.inci_name), "bg-background")}
          {...register("inci_name")}
        />
        <FormFieldError message={errors.inci_name?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <RequiredLabel htmlFor="impact_score">Impact Score</RequiredLabel>
          <Controller
            name="impact_score"
            control={control}
            render={({ field }) => (
              <select
                id="impact_score"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.impact_score)}
                className={selectClassName(Boolean(errors.impact_score))}
              >
                <option value="" disabled>
                  Select score
                </option>
                {IMPACT_SCORES.map((score) => (
                  <option key={score} value={score}>
                    {score}
                  </option>
                ))}
              </select>
            )}
          />
          <FormFieldError message={errors.impact_score?.message} />
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="classification">Classification</RequiredLabel>
          <Controller
            name="classification"
            control={control}
            render={({ field }) => (
              <select
                id="classification"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.classification)}
                className={selectClassName(Boolean(errors.classification))}
              >
                <option value="" disabled>
                  Select classification
                </option>
                {INGREDIENT_CLASSIFICATIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            )}
          />
          <FormFieldError message={errors.classification?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <RequiredLabel htmlFor="plain_english_summary">
          Plain English Summary
        </RequiredLabel>
        <Input
          id="plain_english_summary"
          aria-invalid={Boolean(errors.plain_english_summary)}
          className={fieldClassName(
            Boolean(errors.plain_english_summary),
            "bg-background",
          )}
          {...register("plain_english_summary")}
        />
        <FormFieldError message={errors.plain_english_summary?.message} />
      </div>
      <div className="space-y-2">
        <RequiredLabel htmlFor="notes">Notes</RequiredLabel>
        <Input
          id="notes"
          aria-invalid={Boolean(errors.notes)}
          className={fieldClassName(Boolean(errors.notes), "bg-background")}
          {...register("notes")}
        />
        <FormFieldError message={errors.notes?.message} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <LoadingSpinner />
              Saving...
            </>
          ) : ingredient ? (
            "Save Changes"
          ) : (
            "Create Ingredient"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={(): void => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
