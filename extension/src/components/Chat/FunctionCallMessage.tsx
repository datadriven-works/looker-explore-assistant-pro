import React from 'react'
import { FunctionCall } from '../../slices/assistantSlice'
import Chip from '@mui/material/Chip'
import Message from './Message'

const FunctionCallMessage = ({ message }: { message: FunctionCall }) => {
  return (
    <Message actor="system" createdAt={Date.now()}>
      <div className="flex flex-col">
        <Chip label={message.name.replace(/_/g, ' ')} />
      </div>
    </Message>
  )
}

export default FunctionCallMessage