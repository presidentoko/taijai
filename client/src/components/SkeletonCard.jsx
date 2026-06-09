export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-3">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-5 w-full" />
      <div className="skeleton h-4 w-3/4" />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="skeleton h-11" />
        <div className="skeleton h-11" />
      </div>
    </div>
  );
}
