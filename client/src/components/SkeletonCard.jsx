export function SkeletonCard() {
  return (
    <div className="card">
      <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px' }} />
      <div className="skeleton" style={{ width: '60%', height: 14, margin: '0 auto 8px' }} />
      <div className="skeleton" style={{ width: '40%', height: 12, margin: '0 auto' }} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-16" style={{ padding: '18px 0' }}>
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      <div className="flex-col gap-8" style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: '30%', height: 12 }} />
        <div className="skeleton" style={{ width: '18%', height: 10 }} />
      </div>
    </div>
  );
}
