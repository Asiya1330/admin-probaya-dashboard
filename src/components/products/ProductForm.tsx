"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type JSX } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createProduct,
  generateProductSummaries,
  updateProduct,
} from "@/actions/products.actions";
import { FormFieldError } from "@/components/shared/FormFieldError";
import { ImageUrlField } from "@/components/shared/ImageUrlField";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RequiredLabel } from "@/components/shared/RequiredLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fieldClassName } from "@/lib/form-field-styles";
import {
  IMAGE_URL_VALIDATION_MESSAGE,
  validateImageUrl,
} from "@/lib/validators/image-url";
import {
  PRODUCT_CATEGORIES,
  productFormSchema,
  type ProductFormInput,
} from "@/lib/validators/product.schema";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/admin.types";

type ProductFormProps = {
  product?: Product;
};

const isProductCategory = (
  value: string | null | undefined,
): value is (typeof PRODUCT_CATEGORIES)[number] =>
  Boolean(value && PRODUCT_CATEGORIES.includes(value as (typeof PRODUCT_CATEGORIES)[number]));

const textareaClassName = (hasError: boolean): string =>
  fieldClassName(
    hasError,
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  );

export const ProductForm = ({ product }: ProductFormProps): JSX.Element => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      product_name: product?.product_name ?? "",
      brand: product?.brand ?? "",
      barcode: product?.barcode ?? "",
      category: isProductCategory(product?.category) ? product.category : undefined,
      image_url: product?.image_url ?? "",
      ingredients_list: product?.ingredients_list ?? "",
      score_summary: product?.score_summary ?? "",
      short_description: product?.short_description ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values): Promise<void> => {
    const imageOk = await validateImageUrl(values.image_url);
    if (!imageOk) {
      form.setError("image_url", {
        type: "validate",
        message: IMAGE_URL_VALIDATION_MESSAGE,
      });
      return;
    }

    const payload = {
      product_name: values.product_name,
      brand: values.brand,
      barcode: values.barcode,
      category: values.category,
      image_url: values.image_url,
      ingredients_list: values.ingredients_list,
      score_summary: values.score_summary?.trim() || null,
      short_description: values.short_description?.trim() || null,
    };

    startTransition(async (): Promise<void> => {
      const result = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(product ? "Product updated" : "Product created");
      router.push(`/products/${result.data.id}/edit`);
      router.refresh();
    });
  });

  const handleGenerateSummaries = (): void => {
    if (!product) return;

    setIsGenerating(true);
    void generateProductSummaries(product.id).then((response) => {
      setIsGenerating(false);

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      form.setValue(
        "score_summary",
        response.data.score_summary ?? "",
        { shouldDirty: true },
      );
      form.setValue(
        "short_description",
        response.data.short_description ?? "",
        { shouldDirty: true },
      );
      toast.success(response.data.message);
    });
  };

  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4 rounded-xl border border-border bg-card p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <RequiredLabel htmlFor="product_name">Product Name</RequiredLabel>
          <Input
            id="product_name"
            aria-invalid={Boolean(errors.product_name)}
            className={fieldClassName(Boolean(errors.product_name), "bg-background")}
            {...register("product_name")}
          />
          <FormFieldError message={errors.product_name?.message} />
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="brand">Brand</RequiredLabel>
          <Input
            id="brand"
            aria-invalid={Boolean(errors.brand)}
            className={fieldClassName(Boolean(errors.brand), "bg-background")}
            {...register("brand")}
          />
          <FormFieldError message={errors.brand?.message} />
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="barcode">Barcode</RequiredLabel>
          <Input
            id="barcode"
            aria-invalid={Boolean(errors.barcode)}
            className={fieldClassName(Boolean(errors.barcode), "bg-background")}
            {...register("barcode")}
          />
          <FormFieldError message={errors.barcode?.message} />
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="category">Category</RequiredLabel>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="category"
                  aria-invalid={Boolean(errors.category)}
                  className={cn(
                    "w-full",
                    fieldClassName(Boolean(errors.category)),
                  )}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FormFieldError message={errors.category?.message} />
        </div>
      </div>

      <ImageUrlField
        register={register("image_url")}
        error={errors.image_url}
        setError={form.setError}
        clearErrors={form.clearErrors}
        defaultValue={product?.image_url ?? ""}
      />

      <div className="space-y-2">
        <RequiredLabel htmlFor="ingredients_list">
          Ingredients (comma-separated INCI names)
        </RequiredLabel>
        <textarea
          id="ingredients_list"
          rows={4}
          aria-invalid={Boolean(errors.ingredients_list)}
          className={textareaClassName(Boolean(errors.ingredients_list))}
          {...register("ingredients_list")}
        />
        <FormFieldError message={errors.ingredients_list?.message} />
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              AI summaries
            </h3>
            <p className="text-sm text-muted-foreground">
              Edit manually or generate with AI, then save the product.
            </p>
          </div>
          {product ? (
            <Button
              type="button"
              className="shrink-0 bg-[#8b5cf6] hover:bg-[#7c3aed]"
              disabled={isGenerating || isPending}
              onClick={handleGenerateSummaries}
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate with AI
                </>
              )}
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="short_description"
            className="text-sm font-medium text-foreground"
          >
            Short description
          </label>
          <textarea
            id="short_description"
            rows={3}
            aria-invalid={Boolean(errors.short_description)}
            className={textareaClassName(Boolean(errors.short_description))}
            placeholder="Brief product description"
            {...register("short_description")}
          />
          <FormFieldError message={errors.short_description?.message} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="score_summary"
            className="text-sm font-medium text-foreground"
          >
            Score summary
          </label>
          <textarea
            id="score_summary"
            rows={4}
            aria-invalid={Boolean(errors.score_summary)}
            className={textareaClassName(Boolean(errors.score_summary))}
            placeholder="Explanation of the product score"
            {...register("score_summary")}
          />
          <FormFieldError message={errors.score_summary?.message} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || isGenerating}>
          {isPending ? (
            <>
              <LoadingSpinner />
              Saving...
            </>
          ) : product ? (
            "Save Product"
          ) : (
            "Create Product"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={(): void => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
