export type ProjectRole = "founder" | "investor" | "contributor" | "temporary";
export type ProjectStatus = "active" | "archived" | "dissolved";
export type MemberStatus = "active" | "exited";
export type PoolStatus = "draft" | "collecting" | "reviewing" | "appeal" | "settled" | "appeal_settled";
export type MotionType = "pool_amount" | "rules_change";
export type MotionStatus = "pending" | "approved" | "rejected";

export type ProjectRow = {
  id: string;
  founder_id: string;
  title: string;
  description: string;
  rules_text: string;
  total_assets: number;
  total_revenue: number;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export type ProjectMemberRow = {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  investment_coins: number;
  contribution_coins: number;
  status: MemberStatus;
  joined_at: string;
  exited_at: string | null;
};

export type ProjectMemberView = ProjectMemberRow & {
  display_name: string;
  total_coins: number;
};

export type MonthlyPoolRow = {
  id: string;
  project_id: string;
  year_month: string;
  pool_amount: number;
  status: PoolStatus;
  review_round: number;
  review_closed_at: string | null;
  appeal_deadline: string | null;
  created_at: string;
};

export type ProjectDetail = ProjectRow & {
  founder_name: string;
  member_count: number;
  total_jihe_coins: number;
  my_role: ProjectRole | null;
  my_membership: ProjectMemberRow | null;
};

export type BlindReviewVoteInput = {
  target_id: string;
  points: number;
};
