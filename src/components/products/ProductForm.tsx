"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition, type JSX } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { createProduct, updateProduct } from "@/actions/products.actions";
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

export const ProductForm = ({ product }: ProductFormProps): JSX.Element => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      product_name: product?.product_name ?? "",
      brand: product?.brand ?? "",
      barcode: product?.barcode ?? "",
      category: isProductCategory(product?.category) ? product.category : undefined,
      image_url: product?.image_url ?? "",
      ingredients_list: product?.ingredients_list ?? "",
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
          className={fieldClassName(
            Boolean(errors.ingredients_list),
            "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
          {...register("ingredients_list")}
        />
        <FormFieldError message={errors.ingredients_list?.message} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
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
