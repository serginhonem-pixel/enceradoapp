interface BadgeProps {
  label: string;
  variant?: "green" | "amber" | "red" | "blue" | "gray" | "purple";
}

const styles = {
  green:  "bg-emerald-50  text-emerald-700  border-emerald-200",
  amber:  "bg-amber-50    text-amber-700    border-amber-200",
  red:    "bg-red-50      text-red-600      border-red-200",
  blue:   "bg-blue-50     text-blue-700     border-blue-200",
  gray:   "bg-slate-100   text-slate-600    border-slate-200",
  purple: "bg-purple-50   text-purple-700   border-purple-200",
};

export function Badge({ label, variant = "gray" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center text-[0.7rem] font-semibold px-2 py-0.5 rounded-full border ${styles[variant]}`}>
      {label}
    </span>
  );
}
