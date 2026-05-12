export default function PageHeader({ title, subtitle, action, preTitle = '[RED BALL ACADEMY]' }) {
  return (
    <div className="flex items-center justify-between mb-8 mt-2">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase mb-2">{preTitle}</p>
        <h1 className="text-5xl serif-heading text-[#111111] uppercase tracking-tight">{title}.</h1>
        {subtitle && <p className="text-sm text-[#666666] mt-3">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
