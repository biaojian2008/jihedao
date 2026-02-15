/**
 * 交流对话页
 */
import { ChatView } from "@/components/dm/chat-view";

type Props = { params: Promise<{ id: string }> };

export default async function DmConversationPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <ChatView conversationId={id} />
    </div>
  );
}
