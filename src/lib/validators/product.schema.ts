import { z } from "zod";

import { isHttpUrl } from "@/lib/validators/image-url";

export const PRODUCT_CATEGORIES = [
  "wash",
  "pad",
  "tampon",
  "liner",
  "cup",
  "lubricant",
  "period underwear",
] as const;

export const productFormSchema = z.object({
  product_name: z.string().trim().min(1, "Product name is required"),
  brand: z.string().trim().min(1, "Brand is required"),
  barcode: z.string().trim().min(1, "Barcode is required"),
  category: z.enum(PRODUCT_CATEGORIES, {
    error: "Category is required",
  }),
  image_url: z
    .string()
    .trim()
    .min(1, "Image URL is required")
    .refine(isHttpUrl, "Enter a valid http or https URL"),
  ingredients_list: z
    .string()
    .trim()
    .min(1, "Ingredients list is required"),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
