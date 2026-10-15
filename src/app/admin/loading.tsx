export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 bg-gray-200 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="h-3 w-20 bg-gray-200 rounded skeleton mb-3" />
            <div className="h-7 w-12 bg-gray-200 rounded skeleton" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm h-64 skeleton" />
    </div>
  )
}
