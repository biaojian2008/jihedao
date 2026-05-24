import type { ProjectMemberRow, ProjectRole } from "./types";

export const SHAREHOLDER_ROLES: ProjectRole[] = ["founder", "investor"];

export function isShareholder(role: ProjectRole | string): boolean {
  return SHAREHOLDER_ROLES.includes(role as ProjectRole);
}

export function memberTotalCoins(m: Pick<ProjectMemberRow, "investment_coins" | "contribution_coins">): number {
  return Number(m.investment_coins) + Number(m.contribution_coins);
}

export function roleLabel(role: ProjectRole): string {
  const map: Record<ProjectRole, string> = {
    founder: "发起人",
    investor: "投资成员",
    contributor: "贡献成员",
    temporary: "临时参与者",
  };
  return map[role] ?? role;
}
