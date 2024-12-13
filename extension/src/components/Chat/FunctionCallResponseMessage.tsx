import React from 'react'
import { FunctionResponse } from '../../slices/assistantSlice'
import Chip from '@mui/material/Chip'
import Message from './Message'
import { ExploreEmbed } from '../ExploreEmbed'

const ExploreQueryMessage = ({ message }: { message: FunctionResponse }) => {
  const exploreDefinition = message.response
  return (
    <div className="flex justify-start mb-4 min-h-[400px]">
      <ExploreEmbed
        modelName={exploreDefinition.model}
        exploreId={exploreDefinition.view}
        exploreParams={exploreDefinition}
      />
    </div>
  )
}

const FunctionCallResponseMessage = ({ message }: { message: FunctionResponse }) => {
  if (message.name == 'get_explore_query') {
    return <ExploreQueryMessage message={message} />
  }

  return <></>
}

export default FunctionCallResponseMessage
