export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-main flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 h-80 bg-white rounded-2xl border border-gray-100 skeleton" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded-lg skeleton" />
          <div className="h-64 bg-white rounded-2xl border border-gray-100 skeleton" />
        </div>
      </div>
    </div>
  )
}
