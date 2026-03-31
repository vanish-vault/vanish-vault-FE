"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SideMenu } from "@/src/components/layout/SideMenu";
import { useAppSelector } from "@/src/store/hooks";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isAuthenticated, router]);

  return <SideMenu>{children}</SideMenu>;
}
