import { Building2, Car, KeyRound, HeartHandshake } from "lucide-react";

const MAP = { Building2, Car, KeyRound, HeartHandshake };

export const Icon = ({ name, ...props }) => {
  const C = MAP[name];
  return <C aria-hidden {...props} />;
};
