export type Role = "guest" | "admin" | "manager" | "courier" | "engineer";

export const roleRank: Record<Role, number> = {
  guest: 0,
  courier: 10,
  manager: 20,
  engineer: 30,
  admin: 40,
};

export function hasRole(userRole: Role | null | undefined, minRole: Role) {
  const r = (userRole ?? "guest") as Role;
  return (roleRank[r] ?? 0) >= (roleRank[minRole] ?? 0);
}
