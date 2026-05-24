import { ProjectMembersClient } from "@/components/projects/project-subpages";

export default async function ProjectMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectMembersClient projectId={id} />;
}
