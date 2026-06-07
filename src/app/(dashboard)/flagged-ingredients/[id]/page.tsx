import { notFound } from "next/navigation";
import { type JSX } from "react";

import { FlaggedIngredientReviewPanel } from "@/components/flagged-ingredients/FlaggedIngredientReviewPanel";
import {
  getFlaggedIngredientById,
  getLinkedProductsForFlagged,
} from "@/lib/flagged-ingredients";

type FlaggedIngredientReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FlaggedIngredientReviewPage({
  params,
}: FlaggedIngredientReviewPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const flagged = await getFlaggedIngredientById(id);

  if (!flagged || flagged.status !== "Pending") {
    notFound();
  }

  const linkedProducts = await getLinkedProductsForFlagged(flagged.product_ids);

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <FlaggedIngredientReviewPanel
        flagged={flagged}
        linkedProducts={linkedProducts}
      />
    </div>
  );
}
