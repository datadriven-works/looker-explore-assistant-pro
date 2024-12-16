import React, { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import Message from '../../components/Chat/Message'
import { AssistantState, ChatMessage } from '../../slices/assistantSlice'
import CircularProgress from '@mui/material/CircularProgress'
import FunctionCallMessage from '../../components/Chat/FunctionCallMessage'
import FunctionCallResponseMessage from '../../components/Chat/FunctionCallResponseMessage'

interface MessageThreadProps {
  endOfMessageRef: React.RefObject<HTMLDivElement>
}

const MessageThread = ({ endOfMessageRef }: MessageThreadProps) => {
  const { currentExploreThread, isQuerying } = useSelector(
    (state: RootState) => state.assistant as AssistantState,
  )

  const scrollIntoView = useCallback(() => {
    endOfMessageRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [endOfMessageRef])

  useEffect(() => {
    scrollIntoView()
  }, [currentExploreThread])

  if(currentExploreThread === null) {
    return <></>
  }

  const messages = currentExploreThread.messages as ChatMessage[]
  return (
    <div className="">
      {messages.map((message) => {
        if (message.type === 'functionCall') {
          return <FunctionCallMessage key={message.uuid} message={message} />
        } else if (message.type === 'functionResponse') {
          return <FunctionCallResponseMessage key={message.uuid} message={message} />
        } else if (message.type == 'text') {
          return (
            <Message
              key={message.uuid}
              message={message.message}
              actor={message.actor}
              createdAt={message.createdAt}
            />
          )
        }
      })}
      {isQuerying && (
        <div className="flex flex-col text-gray-300 size-8">
          <CircularProgress color={'inherit'} size={'inherit'} />
        </div>
      )}
      <div ref={endOfMessageRef} />
    </div>
  )
}

export default MessageThread
