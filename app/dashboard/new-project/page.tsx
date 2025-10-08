import { DashboardLayout } from "@/components/dashboard-layout"

export default function Page() {
  return (
    <DashboardLayout>
      <div className="px-4 lg:px-6">
        <h2 className="text-2xl font-bold">New Project</h2>
        <p>Create a new project here.</p>
        {/* Add form or content here */}
      </div>
    </DashboardLayout>
  )
}