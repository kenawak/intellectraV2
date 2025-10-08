import { DashboardLayout } from "@/components/dashboard-layout"

export default function Page() {
  return (
    <DashboardLayout>
      <div className="px-4 lg:px-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <p>View and manage your projects here.</p>
        {/* Add project list or content here */}
      </div>
    </DashboardLayout>
  )
}