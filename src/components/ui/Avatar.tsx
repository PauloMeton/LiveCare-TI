export function Avatar({
  name,
  size = 36,
  color,
}: {
  name?: string | null;
  size?: number;
  color?: string;
}) {
  const initials = (name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-graphite-800 border border-graphite-200 flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: color || "var(--graphite-200, #ebebe8)",
      }}
    >
      {initials}
    </div>
  );
}
