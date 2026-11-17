"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { createApiClient, ApiClient } from "./client";

export function useApiClient() {
  const { tokenRef } = useAuth();
  const [api, setApi] = useState<ApiClient | null>(null);

  useEffect(() => {
    setApi(createApiClient(() => tokenRef.current));
  }, [tokenRef]);

  return api!;
}