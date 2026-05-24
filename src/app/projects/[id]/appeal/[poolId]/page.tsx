import { ProjectAppealClient } from "@/components/projects/project-subpages";

export default async function ProjectAppealPage({
  params,
}: {
  params: Promise<{ id: string; poolId: string }>;
}) {
  const { id, poolId } = await params;
  return <ProjectAppealClient projectId={id} poolId={poolId} />;
}
