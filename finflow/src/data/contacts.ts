export type Contact = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export const CONTACTS: Contact[] = [
  { id: "maya", name: "Maya", initials: "MY", color: "#1B5C44" },
  { id: "ravi", name: "Ravi", initials: "RV", color: "#2D6A4F" },
  { id: "cafe", name: "Cafe 12", initials: "C12", color: "#0F3D2E" },
  { id: "stall", name: "Stall 01", initials: "S1", color: "#145C3A" },
  { id: "uma", name: "Umair", initials: "UR", color: "#3A7D5A" },
];
