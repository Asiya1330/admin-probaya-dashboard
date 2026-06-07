"use client";

import { useCallback, useState, type JSX } from "react";

import { checkBarcodeUnique } from "@/actions/product-wizard.actions";
import { FormFieldError } from "@/components/shared/FormFieldError";
import { RequiredLabel } from "@/components/shared/RequiredLabel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fieldClassName } from "@/lib/form-field-styles";
import {
  WIZARD_CATEGORIES,
  type WizardProductDetails,
} from "@/types/product-wizard.types";

type Step1ProductDetailsProps = {
  details: WizardProductDetails;
  onChange: (details: WizardProductDetails) => void;
  barcodeError: string | null;
  onBarcodeError: (error: string | null) => void;
};

const YES_NO_OPTIONS = ["Yes", "No"] as const;

const optionalInput = (
  id: string,
  label: string,
  value: string,
  onChange: (value: string) => void,
): JSX.Element => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-background"
    />
  </div>
);

export const Step1ProductDetails = ({
  details,
  onChange,
  barcodeError,
  onBarcodeError,
}: Step1ProductDetailsProps): JSX.Element => {
  const [isCheckingBarcode, setIsCheckingBarcode] = useState(false);

  const update = (patch: Partial<WizardProductDetails>): void => {
    onChange({ ...details, ...patch });
  };

  const handleBarcodeBlur = useCallback(async (): Promise<void> => {
    const trimmed = details.barcode.trim();
    if (!trimmed) {
      onBarcodeError("Barcode is required");
      return;
    }

    setIsCheckingBarcode(true);
    const result = await checkBarcodeUnique(trimmed);
    setIsCheckingBarcode(false);

    if (!result.success) {
      onBarcodeError(result.error);
      return;
    }

    if (!result.data.unique) {
      onBarcodeError("This barcode is already used by another product");
      return;
    }

    onBarcodeError(null);
  }, [details.barcode, onBarcodeError]);

  const requiredInvalid = !details.product_name.trim() ||
    !details.brand.trim() ||
    !details.category ||
    !details.barcode.trim() ||
    Boolean(barcodeError);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Product Details</h3>
        <p className="text-sm text-muted-foreground">
          Enter the core product information. Required fields are marked with *.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <RequiredLabel htmlFor="product_name">Product Name</RequiredLabel>
          <Input
            id="product_name"
            value={details.product_name}
            onChange={(e) => update({ product_name: e.target.value })}
            className="bg-background"
            aria-invalid={!details.product_name.trim()}
          />
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="brand">Brand</RequiredLabel>
          <Input
            id="brand"
            value={details.brand}
            onChange={(e) => update({ brand: e.target.value })}
            className="bg-background"
            aria-invalid={!details.brand.trim()}
          />
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="category">Category</RequiredLabel>
          <Select
            value={details.category || undefined}
            onValueChange={(value) =>
              update({ category: value as WizardProductDetails["category"] })
            }
          >
            <SelectTrigger
              id="category"
              className={fieldClassName(!details.category, "w-full bg-background")}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {WIZARD_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="barcode">Barcode</RequiredLabel>
          <Input
            id="barcode"
            value={details.barcode}
            onChange={(e) => {
              update({ barcode: e.target.value });
              onBarcodeError(null);
            }}
            onBlur={() => void handleBarcodeBlur()}
            className={fieldClassName(Boolean(barcodeError), "bg-background")}
            aria-invalid={Boolean(barcodeError)}
          />
          {isCheckingBarcode ? (
            <p className="text-xs text-muted-foreground">Checking barcode…</p>
          ) : null}
          <FormFieldError message={barcodeError ?? undefined} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {optionalInput("image_url", "Image URL", details.image_url, (v) =>
          update({ image_url: v }),
        )}
        {optionalInput(
          "fragrance_type",
          "Fragrance Type",
          details.fragrance_type,
          (v) => update({ fragrance_type: v }),
        )}
        {optionalInput(
          "bleaching_method",
          "Bleaching Method",
          details.bleaching_method,
          (v) => update({ bleaching_method: v }),
        )}
        {optionalInput("ph_level", "pH Level", details.ph_level, (v) =>
          update({ ph_level: v }),
        )}
        {optionalInput(
          "preservatives",
          "Preservatives",
          details.preservatives,
          (v) => update({ preservatives: v }),
        )}
        {optionalInput(
          "synthetic_materials",
          "Synthetic Materials",
          details.synthetic_materials,
          (v) => update({ synthetic_materials: v }),
        )}
        {optionalInput(
          "material_composition",
          "Material Composition",
          details.material_composition,
          (v) => update({ material_composition: v }),
        )}
        {optionalInput("absorbency", "Absorbency", details.absorbency, (v) =>
          update({ absorbency: v }),
        )}
        {optionalInput("size_count", "Size / Count", details.size_count, (v) =>
          update({ size_count: v }),
        )}
        {optionalInput("source_url", "Source URL", details.source_url, (v) =>
          update({ source_url: v }),
        )}
        {(["usda_organic", "gots_certified", "oeko_tex_certified", "gyno_approved"] as const).map(
          (field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>
                {field
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </Label>
              <Select
                value={details[field] || undefined}
                onValueChange={(value) => update({ [field]: value })}
              >
                <SelectTrigger id={field} className="w-full bg-background">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {YES_NO_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ),
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={details.verified}
          onChange={(e) => update({ verified: e.target.checked })}
          className="size-4 rounded border-border"
        />
        Verified
      </label>

      {requiredInvalid ? (
        <p className="text-sm text-muted-foreground">
          Fill all required fields and ensure the barcode is unique to continue.
        </p>
      ) : null}
    </div>
  );
};
