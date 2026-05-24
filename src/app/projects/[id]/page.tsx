import { ProjectDetailClient } from "@/components/projects/project-detail-client";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailClient projectId={id} />;
}
