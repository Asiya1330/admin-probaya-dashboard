import { notFound } from "next/navigation";
import { type JSX } from "react";

import { IngredientForm } from "@/components/ingredients/IngredientForm";
import { getIngredientById } from "@/lib/ingredients";

type EditIngredientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditIngredientPage({
  params,
}: EditIngredientPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const ingredient = await getIngredientById(id);

  if (!ingredient) {
    notFound();
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">Edit Ingredient</h2>
      <IngredientForm ingredient={ingredient} />
    </div>
  );
}
