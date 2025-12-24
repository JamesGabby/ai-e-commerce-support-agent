import { Chat } from "@/components/chat";
import { generateUUID } from "@/lib/utils";
import { auth } from "@/app/(auth)/auth";

export default async function WidgetPage() {
  const session = await auth();
  
  // For widget, we'll allow anonymous users with a generated ID
  const chatId = generateUUID();

  return (
    <div className="widget-container h-screen w-full">
      <Chat
        id={chatId}
        initialMessages={[]}
        initialChatModel="google/gemini-2.5-flash-lite"
        initialVisibilityType="private"
        isReadonly={false}
        autoResume={false}
      />
    </div>
  );
}