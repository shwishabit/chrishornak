export function BackgroundMesh() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {/* Teal glow — top center */}
      <div
        className="absolute top-[-15%] left-[50%] h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-[0.08] blur-[140px]"
        style={{ background: 'radial-gradient(circle, #2dd4a8 0%, transparent 70%)' }}
      />
      {/* Secondary teal glow — bottom right */}
      <div
        className="absolute right-[-10%] bottom-[10%] h-[400px] w-[400px] rounded-full opacity-[0.05] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #2dd4a8 0%, transparent 70%)' }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 50%) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  )
}
