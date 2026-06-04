"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import type { FieldError, UseFormRegisterReturn, UseFormSetError } from "react-hook-form";

import { FormFieldError } from "@/components/shared/FormFieldError";
import { RequiredLabel } from "@/components/shared/RequiredLabel";
import { Input } from "@/components/ui/input";
import { fieldClassName } from "@/lib/form-field-styles";
import {
  IMAGE_URL_VALIDATION_MESSAGE,
  isLikelyImageUrl,
  probeImageUrl,
} from "@/lib/validators/image-url";
import { cn } from "@/lib/utils";

type ImageUrlFieldProps = {
  id?: string;
  label?: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  setError: UseFormSetError<{ image_url: string }>;
  clearErrors: (name?: "image_url") => void;
  defaultValue?: string;
};

const applyValidationResult = (
  trimmed: string,
  isValid: boolean,
  clearErrors: ImageUrlFieldProps["clearErrors"],
  setError: ImageUrlFieldProps["setError"],
  setPreviewUrl: (url: string | null) => void,
): void => {
  if (isValid) {
    clearErrors("image_url");
    setPreviewUrl(trimmed);
    return;
  }

  setPreviewUrl(null);
  setError("image_url", {
    type: "validate",
    message: IMAGE_URL_VALIDATION_MESSAGE,
  });
};

export const ImageUrlField = ({
  id = "image_url",
  label = "Image URL",
  register,
  error,
  setError,
  clearErrors,
  defaultValue = "",
}: ImageUrlFieldProps): JSX.Element => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    const trimmed = defaultValue.trim();
    return trimmed && isLikelyImageUrl(trimmed) ? trimmed : null;
  });
  const [isChecking, setIsChecking] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const runImageValidation = useCallback(
    async (trimmed: string, requestId: number): Promise<void> => {
      if (isLikelyImageUrl(trimmed)) {
        clearErrors("image_url");
        setPreviewUrl(trimmed);
      }

      const probed = await probeImageUrl(trimmed);
      if (requestId !== requestIdRef.current) {
        return;
      }

      const isValid = probed || isLikelyImageUrl(trimmed);
      setIsChecking(false);
      applyValidationResult(trimmed, isValid, clearErrors, setError, setPreviewUrl);
    },
    [clearErrors, setError],
  );

  const scheduleImageValidation = useCallback(
    (trimmed: string): void => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      requestIdRef.current += 1;
      setIsChecking(false);

      if (!trimmed) {
        setPreviewUrl(null);
        return;
      }

      if (isLikelyImageUrl(trimmed)) {
        clearErrors("image_url");
        setPreviewUrl(trimmed);
      } else {
        setPreviewUrl(null);
      }

      const requestId = requestIdRef.current;
      debounceRef.current = window.setTimeout(() => {
        setIsChecking(true);
        void runImageValidation(trimmed, requestId);
      }, 400);
    },
    [clearErrors, runImageValidation],
  );

  useEffect(() => {
    const trimmed = defaultValue.trim();
    if (!trimmed) {
      return;
    }

    const requestId = requestIdRef.current;
    const timeout = window.setTimeout(() => {
      setIsChecking(true);
      void runImageValidation(trimmed, requestId);
    }, 0);

    return (): void => {
      window.clearTimeout(timeout);
      requestIdRef.current += 1;
    };
  }, [defaultValue, runImageValidation]);

  useEffect(() => {
    return (): void => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      requestIdRef.current += 1;
    };
  }, []);

  const invalid = Boolean(error);

  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id}>{label}</RequiredLabel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            id={id}
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com/product.jpg"
            aria-invalid={invalid}
            className={fieldClassName(invalid, "bg-background")}
            {...register}
            onChange={(event) => {
              register.onChange(event);
              scheduleImageValidation(event.target.value.trim());
            }}
          />
          {isChecking ? (
            <p className="text-xs text-muted-foreground">Checking image…</p>
          ) : null}
          <FormFieldError message={error?.message} />
        </div>
        {previewUrl ? (
          <div
            className={cn(
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted",
            )}
          >
            <Image
              src={previewUrl}
              alt="Image URL preview"
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
              referrerPolicy="no-referrer"
              onError={() => {
                setPreviewUrl(null);
                setError("image_url", {
                  type: "validate",
                  message: IMAGE_URL_VALIDATION_MESSAGE,
                });
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
