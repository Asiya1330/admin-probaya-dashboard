"use client";

import { Check } from "lucide-react";
import type { JSX } from "react";

import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Product Details" },
  { number: 2, label: "Add Ingredients" },
  { number: 3, label: "Score Unscored" },
  { number: 4, label: "Review & Publish" },
] as const;

type WizardStepperProps = {
  currentStep: number;
  maxReachableStep: number;
  onStepClick: (step: number) => void;
  skipStep3?: boolean;
};

export const WizardStepper = ({
  currentStep,
  maxReachableStep,
  onStepClick,
  skipStep3 = false,
}: WizardStepperProps): JSX.Element => {
  const visibleSteps = skipStep3
    ? STEPS.filter((step) => step.number !== 3)
    : STEPS;

  return (
    <div className="mb-8">
      <p className="mb-4 text-sm text-muted-foreground md:hidden">
        Step {currentStep} of 4 — {STEPS[currentStep - 1]?.label}
      </p>
      <ol className="hidden items-center justify-between gap-2 md:flex">
        {visibleSteps.map((step, index) => {
          const isComplete = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const canNavigate = step.number <= maxReachableStep && !isCurrent;

          return (
            <li key={step.number} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!canNavigate}
                onClick={(): void => {
                  if (canNavigate) {
                    onStepClick(step.number);
                  }
                }}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                  isCurrent && "border-[#8b5cf6] bg-[#8b5cf6]/10",
                  isComplete && "border-[#22c55e]/40 bg-[#22c55e]/10",
                  !isCurrent && !isComplete && "border-border bg-card",
                  canNavigate && "cursor-pointer hover:border-[#8b5cf6]/50",
                  !canNavigate && !isCurrent && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isComplete && "bg-[#22c55e] text-white",
                    isCurrent && "bg-[#8b5cf6] text-white",
                    !isComplete && !isCurrent && "bg-muted text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="size-4" /> : step.number}
                </span>
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    isCurrent ? "text-white" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < visibleSteps.length - 1 ? (
                <div className="h-px w-4 shrink-0 bg-border" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
