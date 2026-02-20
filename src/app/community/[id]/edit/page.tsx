/**
 * 编辑帖子（仅作者）
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { EditPostForm } from "@/components/community/edit-post-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerSupabase();
  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, type, title, content, tags, media_urls, details, returns_description, expected_duration, repay_when, author_collateral, participant_freeze")
    .eq("id", id)
    .single();
  if (!post) redirect("/community");
  const profileId = cookieStore.get("jihe_profile_id")?.value;
  if (!profileId || post.author_id !== profileId) redirect(`/community/${id}`);
  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="mb-4 text-xl font-semibold text-foreground">编辑</h1>
        <EditPostForm post={post as Record<string, unknown>} />
      </main>
    </div>
  );
}
