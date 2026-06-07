"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type JSX } from "react";
import { toast } from "sonner";

import { publishProductWizard } from "@/actions/product-wizard.actions";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { countIngredientsByCategory } from "@/lib/product-wizard-utils";
import {
  EMPTY_PRODUCT_DETAILS,
  type WizardIngredient,
  type WizardProductDetails,
} from "@/types/product-wizard.types";

import { Step1ProductDetails } from "./Step1ProductDetails";
import { Step2AddIngredients } from "./Step2AddIngredients";
import { Step3FooterActions, Step3ScoreUnscored } from "./Step3ScoreUnscored";
import { Step4ReviewPublish } from "./Step4ReviewPublish";
import { WizardStepper } from "./WizardStepper";

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed || null;
};

export const ProductWizard = (): JSX.Element => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [maxReachableStep, setMaxReachableStep] = useState(1);
  const [details, setDetails] = useState<WizardProductDetails>(EMPTY_PRODUCT_DETAILS);
  const [ingredients, setIngredients] = useState<WizardIngredient[]>([]);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const counts = useMemo(
    () => countIngredientsByCategory(ingredients),
    [ingredients],
  );

  const hasUnscored = counts.unscored > 0;
  const skipStep3 = !hasUnscored;

  const step1Valid =
    Boolean(details.product_name.trim()) &&
    Boolean(details.brand.trim()) &&
    Boolean(details.category) &&
    Boolean(details.barcode.trim()) &&
    !barcodeError;

  const step2Valid = ingredients.length > 0 && counts.newCount === 0;

  const step3Valid =
    skipStep3 ||
    ingredients
      .filter((i) => i.category === "unscored")
      .every((i) => i.scoringDecision !== null && i.scoringDecision !== undefined);

  const markDirty = useCallback((): void => {
    setIsDirty(true);
  }, []);

  const handleDetailsChange = (next: WizardProductDetails): void => {
    setDetails(next);
    markDirty();
  };

  const handleIngredientsChange = (next: WizardIngredient[]): void => {
    setIngredients(next);
    markDirty();
  };

  const getNextStep = (from: number): number => {
    if (from === 2 && skipStep3) {
      return 4;
    }
    return from + 1;
  };

  const getPrevStep = (from: number): number => {
    if (from === 4 && skipStep3) {
      return 2;
    }
    return from - 1;
  };

  const isStepValid = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return step1Valid;
      case 2:
        return step2Valid;
      case 3:
        return step3Valid;
      case 4:
        return step2Valid;
      default:
        return false;
    }
  };

  const handleNext = (): void => {
    if (!isStepValid(step)) {
      return;
    }
    const next = getNextStep(step);
    setStep(next);
    setMaxReachableStep((prev) => Math.max(prev, next));
  };

  const handleBack = (): void => {
    setStep(getPrevStep(step));
  };

  const handleStepClick = (target: number): void => {
    if (target <= maxReachableStep && target !== step) {
      setStep(target);
    }
  };

  const handleSkipAllScoring = (): void => {
    setIngredients((prev) =>
      prev.map((item) =>
        item.category === "unscored" && !item.scoringDecision
          ? { ...item, scoringDecision: "skipped" as const, aiSuggestion: null }
          : item,
      ),
    );
    markDirty();
    setStep(4);
    setMaxReachableStep((prev) => Math.max(prev, 4));
  };

  const handlePublish = async (): Promise<void> => {
    const missingIds = ingredients.filter((i) => !i.ingredient_id);
    if (missingIds.length > 0) {
      toast.error("All ingredients must be saved to the database first");
      return;
    }

    setIsPublishing(true);

    const result = await publishProductWizard({
      product: {
        product_name: details.product_name.trim(),
        brand: details.brand.trim(),
        category: details.category,
        barcode: details.barcode.trim(),
        image_url: toNullable(details.image_url),
        fragrance_type: toNullable(details.fragrance_type),
        bleaching_method: toNullable(details.bleaching_method),
        ph_level: toNullable(details.ph_level),
        preservatives: toNullable(details.preservatives),
        synthetic_materials: toNullable(details.synthetic_materials),
        material_composition: toNullable(details.material_composition),
        absorbency: toNullable(details.absorbency),
        size_count: toNullable(details.size_count),
        source_url: toNullable(details.source_url),
        usda_organic: toNullable(details.usda_organic),
        gots_certified: toNullable(details.gots_certified),
        oeko_tex_certified: toNullable(details.oeko_tex_certified),
        gyno_approved: toNullable(details.gyno_approved),
        verified: details.verified,
      },
      ingredients: ingredients.map((item) => ({
        ingredient_id: item.ingredient_id!,
        inci_name: item.inci_name,
        ingredient_name: item.ingredient_name,
        impact_score: item.impact_score,
        classification: item.classification,
        plain_english_summary: item.plain_english_summary,
      })),
    });

    setIsPublishing(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Product created successfully");
    setIsDirty(false);
    router.push(`/products/${result.data.id}/edit`);
    router.refresh();
  };

  const handleCancel = (): void => {
    if (isDirty) {
      setShowExitDialog(true);
      return;
    }
    router.push("/products");
  };

  const nextLabel = (): string => {
    if (step === 1) return "Next: Add Ingredients →";
    if (step === 2) {
      return hasUnscored ? "Next: Score Unscored →" : "Next: Review & Publish →";
    }
    if (step === 3) return "Continue →";
    return "";
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Add Product</h2>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>

      <WizardStepper
        currentStep={step}
        maxReachableStep={maxReachableStep}
        onStepClick={handleStepClick}
        skipStep3={skipStep3}
      />

      <div className="rounded-xl border border-border bg-card p-4 md:p-6">
        {step === 1 ? (
          <Step1ProductDetails
            details={details}
            onChange={handleDetailsChange}
            barcodeError={barcodeError}
            onBarcodeError={setBarcodeError}
          />
        ) : null}

        {step === 2 ? (
          <Step2AddIngredients
            ingredients={ingredients}
            onChange={handleIngredientsChange}
          />
        ) : null}

        {step === 3 && hasUnscored ? (
          <Step3ScoreUnscored
            ingredients={ingredients}
            onChange={handleIngredientsChange}
          />
        ) : null}

        {step === 4 ? (
          <Step4ReviewPublish
            details={details}
            ingredients={ingredients}
            isPublishing={isPublishing}
            onPublish={() => void handlePublish()}
          />
        ) : null}
      </div>

      {step < 4 ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1}
            onClick={handleBack}
          >
            ← Back
          </Button>

          <div className="flex flex-col items-end gap-2">
            {step === 3 ? (
              <Step3FooterActions
                onSkipAll={handleSkipAllScoring}
                canContinue={step3Valid}
              />
            ) : null}
            <Button
              type="button"
              className="btn-success border-0"
              disabled={!isStepValid(step)}
              onClick={handleNext}
            >
              {nextLabel()}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <Button type="button" variant="outline" onClick={handleBack}>
            ← Back
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to exit? Nothing will be saved to products or product_ingredients."
        confirmLabel="Exit without saving"
        cancelLabel="Keep editing"
        variant="destructive"
        onConfirm={() => {
          setShowExitDialog(false);
          router.push("/products");
        }}
      />
    </div>
  );
};
