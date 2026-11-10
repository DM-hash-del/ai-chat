import { useParams } from 'react-router'
import { ChatRuntimeProvider } from '@/chat/ChatRuntimeProvider'
import { useConversation } from '@/chat/useConversation'
import { useConversationList } from '@/chat/useConversationList'
import { Thread } from '@/components/assistant-ui/elements/thread.aui'
import { ThreadList } from '@/components/assistant-ui/elements/thread-list.aui'
import { ChatLayout } from '@/components/ChatLayout'
import { ConversationError } from '@/components/chat/ConversationError'
import { SidebarNotice } from '@/components/chat/SidebarNotice'

// Used for both "/" (new chat) and "/c/:id". The URL decides which
// conversation is shown. This page stays mounted when moving between the two,
// so the conversation list is fetched once, not on every switch.
export function ChatPage() {
    const { id } = useParams()
    const list = useConversationList()
    const conversation = useConversation(id, {
        onCreated: list.add,
        onCreatedWithoutReply: list.reload,
    })
    const { loadStatus, loadError } = conversation

    return (
        <ChatRuntimeProvider conversation={conversation} list={list}>
            <ChatLayout
                sidebar={
                    <>
                        <SidebarNotice
                            status={list.status}
                            loadError={list.loadError}
                            renameError={list.renameError}
                            dismissRenameError={list.dismissRenameError}
                            reload={list.reload}
                        />
                        <ThreadList showEmpty={list.status !== 'error'} />
                    </>
                }
            >
                {loadStatus === 'not_found' || loadStatus === 'error' ? (
                    <ConversationError status={loadStatus} error={loadError} />
                ) : (
                    <Thread />
                )}
            </ChatLayout>
        </ChatRuntimeProvider>
    )
}
