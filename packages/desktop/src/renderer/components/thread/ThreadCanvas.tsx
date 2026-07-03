import { useStore } from '@/store'
import { WelcomeScreen } from './WelcomeScreen'
import { MessageList } from './MessageList'

export default function ThreadCanvas() {
  const { activeThreadId, activeView } = useStore()

  if (activeView === 'new-thread' && !activeThreadId) {
    return <WelcomeScreen />
  }

  return <MessageList />
}
