import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { authClient } from "@/lib/auth-client"
import data from "./data.json"

export default function Page() {
  const session = authClient
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  )
}
