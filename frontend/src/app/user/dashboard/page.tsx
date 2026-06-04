"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/user/appointments");
  }, [router]);
  return null;
}
