import { type JSX } from "react";

type PageWrapperProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export const PageWrapper = ({
  title,
  description,
  children,
}: PageWrapperProps): JSX.Element => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-6 md:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
    </div>
  );
};
