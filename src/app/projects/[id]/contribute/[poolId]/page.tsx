import { ProjectContributeClient } from "@/components/projects/project-subpages";

export default async function ProjectContributePage({
  params,
}: {
  params: Promise<{ id: string; poolId: string }>;
}) {
  const { id, poolId } = await params;
  return <ProjectContributeClient projectId={id} poolId={poolId} />;
}
