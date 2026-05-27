"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { getTenant, getTenantBySlug } from "@/lib/firestore";
import type { Tenant } from "@/types";

interface TenantCtx {
  tenant: Tenant | null;
  loading: boolean;
}

import React from "react";
export const TenantContext = createContext<TenantCtx>({ tenant: null, loading: true });

export function useTenant() {
  return useContext(TenantContext);
}
