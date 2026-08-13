export default function PageHeader({ title, desc, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold break-words">{title}</h1>
        {desc && <p className="text-xs sm:text-sm text-muted mt-1">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
