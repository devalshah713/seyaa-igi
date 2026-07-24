import { SHAPE_ICONS } from "./shape-icons-data";

// Canonical shape names that don't exactly match an icon key.
const ICON_ALIAS: Record<string, string> = { Hexagonal: "Hexagon" };

export function ShapeIcon({ name, selected }: { name: string; selected: boolean }) {
  const key = ICON_ALIAS[name] ?? name;
  const paths = SHAPE_ICONS[key] ?? SHAPE_ICONS.Round;
  const stroke = selected ? "#C0551A" : "#6E645B";
  const gb = selected ? "#FCEFE6" : "#FFFFFF";
  const gt = selected ? "#F8E6DA" : "#F1ECE6";
  return (
    <svg
      width="34" height="29" viewBox="0 0 40 34" fill="none"
      strokeLinejoin="round" strokeLinecap="round"
      style={{ color: stroke, ["--gb" as string]: gb, ["--gt" as string]: gt }}
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
}
