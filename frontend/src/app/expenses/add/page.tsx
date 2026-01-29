"use client";

import ExpenseManager from "@/app/pages/ExpenseManager";
import SuperAdminGuard from "@/components/SuperAdminGuard";

export default function AddExpensePage() {
  return (
    <SuperAdminGuard>
      <ExpenseManager initialTab="add" />
    </SuperAdminGuard>
  );
}
