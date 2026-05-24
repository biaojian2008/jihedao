import { ProjectDividendClient } from "@/components/projects/project-subpages";

export default async function ProjectDividendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDividendClient projectId={id} />;
}
