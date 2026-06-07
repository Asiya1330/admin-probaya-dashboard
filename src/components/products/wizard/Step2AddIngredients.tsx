"use client";

import { useCallback, useRef, useState, type JSX } from "react";
import { toast } from "sonner";

import {
  matchIngredients,
  searchIngredientsForWizard,
} from "@/actions/product-wizard.actions";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  countIngredientsByCategory,
  ingredientFromMatch,
  parseIngredientsList,
} from "@/lib/product-wizard-utils";
import type { Ingredient } from "@/types/admin.types";
import type { WizardIngredient } from "@/types/product-wizard.types";

import { IngredientSection } from "./IngredientSection";

type Step2AddIngredientsProps = {
  ingredients: WizardIngredient[];
  onChange: (ingredients: WizardIngredient[]) => void;
};

export const Step2AddIngredients = ({
  ingredients,
  onChange,
}: Step2AddIngredientsProps): JSX.Element => {
  const [rawList, setRawList] = useState("");
  const [typeahead, setTypeahead] = useState("");
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<number | null>(null);
  const searchRequestRef = useRef(0);

  const counts = countIngredientsByCategory(ingredients);
  const scored = ingredients.filter((i) => i.category === "scored");
  const unscored = ingredients.filter((i) => i.category === "unscored");
  const newItems = ingredients.filter((i) => i.category === "new");

  const scheduleTypeaheadSearch = useCallback((value: string): void => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const requestId = ++searchRequestRef.current;
    searchDebounceRef.current = window.setTimeout(() => {
      setIsSearching(true);
      void searchIngredientsForWizard(trimmed).then((result) => {
        if (requestId !== searchRequestRef.current) {
          return;
        }
        setIsSearching(false);
        if (result.success) {
          setSuggestions(result.data);
        }
      });
    }, 300);
  }, []);

  const addIngredient = (item: WizardIngredient): void => {
    const exists = ingredients.some(
      (i) =>
        i.inci_name.toLowerCase() === item.inci_name.toLowerCase() ||
        i.typedName.toLowerCase() === item.typedName.toLowerCase(),
    );
    if (exists) {
      toast.error("Ingredient already in list");
      return;
    }
    onChange([...ingredients, item]);
    setTypeahead("");
    setSuggestions([]);
  };

  const handleParse = async (): Promise<void> => {
    const names = parseIngredientsList(rawList);
    if (names.length === 0) {
      toast.error("Paste a comma-separated ingredient list first");
      return;
    }

    setIsParsing(true);
    const result = await matchIngredients(names);
    setIsParsing(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const existingKeys = new Set(
      ingredients.map((i) => i.typedName.toLowerCase()),
    );
    const toAdd = result.data
      .filter((m) => !existingKeys.has(m.typedName.toLowerCase()))
      .map((m) => ingredientFromMatch(m.typedName, m.ingredient));

    onChange([...ingredients, ...toAdd]);
    toast.success(`Parsed ${toAdd.length} ingredient(s)`);
  };

  const handleAddTyped = async (): Promise<void> => {
    const trimmed = typeahead.trim();
    if (!trimmed) return;

    const result = await matchIngredients([trimmed]);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const match = result.data[0];
    addIngredient(ingredientFromMatch(match.typedName, match.ingredient));
  };

  const handleSelectSuggestion = (ingredient: Ingredient): void => {
    addIngredient(
      ingredientFromMatch(ingredient.ingredient_name, ingredient),
    );
  };

  const updateIngredient = (id: string, updated: WizardIngredient): void => {
    onChange(ingredients.map((i) => (i.id === id ? updated : i)));
  };

  const removeIngredient = (id: string): void => {
    onChange(ingredients.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Add Ingredients</h3>
        <p className="text-sm text-muted-foreground">
          Paste or add ingredients. New ingredients must be saved to the database before continuing.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="raw_ingredients">Raw ingredient list</Label>
        <textarea
          id="raw_ingredients"
          value={rawList}
          onChange={(e) => setRawList(e.target.value)}
          rows={4}
          placeholder="Paste comma-separated INCI names from the product label…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isParsing}
          onClick={() => void handleParse()}
        >
          {isParsing ? (
            <>
              <LoadingSpinner />
              Parsing…
            </>
          ) : (
            "Parse & Match"
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="typeahead">Add individual ingredient</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="typeahead"
              value={typeahead}
              onChange={(e) => {
                setTypeahead(e.target.value);
                scheduleTypeaheadSearch(e.target.value);
              }}
              placeholder="Search or type ingredient name…"
              className="bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAddTyped();
                }
              }}
            />
            {suggestions.length > 0 ? (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                {suggestions.map((s) => (
                  <li key={s.ingredient_id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <span className="text-white">{s.ingredient_name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {s.inci_name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {isSearching ? (
              <p className="mt-1 text-xs text-muted-foreground">Searching…</p>
            ) : null}
          </div>
          <Button type="button" variant="outline" onClick={() => void handleAddTyped()}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <IngredientSection
          title="Scored ✓"
          dotColor="bg-[#22c55e]"
          ingredients={scored}
          onRemove={removeIngredient}
          onUpdate={updateIngredient}
        />
        <IngredientSection
          title="Unscored ⚠"
          dotColor="bg-amber-400"
          badgeClass="border-amber-500/40 bg-amber-500/15 text-amber-300"
          badgeLabel="In DB — not scored yet"
          ingredients={unscored}
          onRemove={removeIngredient}
          onUpdate={updateIngredient}
        />
        <IngredientSection
          title="New ✗"
          dotColor="bg-red-500"
          badgeClass="border-red-500/40 bg-red-500/15 text-red-300"
          badgeLabel="Not in database — must add before continuing"
          ingredients={newItems}
          onRemove={removeIngredient}
          onUpdate={updateIngredient}
          showExpandForm
        />
      </div>

      {counts.newCount > 0 ? (
        <p className="text-sm text-destructive">
          {counts.newCount} ingredient(s) must be added to the database before you can continue.
          Expand each one and fill required fields.
        </p>
      ) : null}

      <div className="sticky bottom-0 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Total: {counts.total} ingredients |{" "}
        <span className="text-[#86efac]">✓ {counts.scored} scored</span> |{" "}
        <span className="text-amber-300">⚠ {counts.unscored} unscored</span>
        {counts.newCount > 0 ? (
          <>
            {" "}| <span className="text-red-300">✗ {counts.newCount} new (blocking)</span>
          </>
        ) : null}
      </div>
    </div>
  );
};
