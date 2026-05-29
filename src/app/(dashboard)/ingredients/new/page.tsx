import { type JSX } from "react";

import { IngredientForm } from "@/components/ingredients/IngredientForm";

export default function NewIngredientPage(): JSX.Element {
  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">Add Ingredient</h2>
      <IngredientForm />
    </div>
  );
}
