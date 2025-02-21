import React from 'react'
import { useLookerFields } from './hooks/useLookerFields'
import { useMetadata } from './hooks/useMetadata'
import AgentPage from './pages/AgentPage'

const ExploreApp = () => {

  // load dimensions, measures and examples into the state
  useLookerFields()
  useMetadata()

  return (
    <>
      <AgentPage />
    </>
  )
}

export const App = ExploreApp
