"use client";
import React, { useState, useEffect, ReactNode } from "react";
import { TenantContext } from "@/hooks/useTenant";
import { getTenantBySlug } from "@/lib/firestore";
import type { Tenant } from "@/types";

export function TenantProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    getTenantBySlug(slug).then((t) => {
      setTenant(t);
      setLoading(false);
    });
  }, [slug]);

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}
