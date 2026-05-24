import { ProjectReviewClient } from "@/components/projects/project-subpages";

export default async function ProjectReviewPage({
  params,
}: {
  params: Promise<{ id: string; poolId: string }>;
}) {
  const { id, poolId } = await params;
  return <ProjectReviewClient projectId={id} poolId={poolId} />;
}
