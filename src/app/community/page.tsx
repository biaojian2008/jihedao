/**
 * 社区 (Community) - 仿 Twitter 瀑布流
 * 真实数据来自 /api/posts，支持搜索、类型筛选、按信用+时间排序
 */
import { CommunityFeed } from "@/components/community/community-feed";

export default function CommunityPage() {
  return <CommunityFeed />;
}
