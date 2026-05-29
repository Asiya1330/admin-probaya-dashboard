"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type JSX } from "react";

type QueryProviderProps = {
  children: React.ReactNode;
};

export const QueryProvider = ({
  children,
}: QueryProviderProps): JSX.Element => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
