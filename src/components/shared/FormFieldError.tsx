import type { JSX } from "react";

type FormFieldErrorProps = {
  message?: string;
};

export const FormFieldError = ({ message }: FormFieldErrorProps): JSX.Element | null => {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
};
