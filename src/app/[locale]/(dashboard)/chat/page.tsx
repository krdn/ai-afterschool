import { getChatSessions } from "@/lib/actions/chat/sessions"
import { ChatPage } from "@/components/chat/chat-page"

type Props = {
  searchParams: Promise<{ q?: string }>
}

export default async function NewChatPage({ searchParams }: Props) {
  const [sessions, params] = await Promise.all([
    getChatSessions(),
    searchParams,
  ])

  return (
    <ChatPage
      initialSessions={sessions}
      initialQuery={params.q}
    />
  )
}
