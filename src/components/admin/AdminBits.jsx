import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ESTADOS = [
  { value: "pendiente", label: "Pendiente", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  { value: "atendida", label: "Atendida", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { value: "descartada", label: "Descartada", cls: "bg-slate-100 text-slate-700 border-slate-300" },
];

export const StatusBadge = ({ estado, testId }) => {
  const e = ESTADOS.find((x) => x.value === estado);
  return <span data-testid={testId} className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${e.cls}`}>{e.label}</span>;
};

export const FilterSelect = ({ value, onChange, options, placeholder, testId }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger data-testid={testId} className="h-11 w-full sm:w-56 rounded-2xl bg-white"><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent>
      <SelectItem value="todos" data-testid={`${testId}-option-todos`}>{placeholder}</SelectItem>
      {options.map((o) => <SelectItem key={o.value} value={o.value} data-testid={`${testId}-option-${o.value}`}>{o.label}</SelectItem>)}
    </SelectContent>
  </Select>
);
