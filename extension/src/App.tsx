import React from 'react'
import { useLookerFields } from './hooks/useLookerFields'
import { useBigQueryExamples } from './hooks/useBigQueryExamples'
import AgentPage from './pages/AgentPage'

const ExploreApp = () => {
  // load dimensions, measures and examples into the state
  useLookerFields()
  useBigQueryExamples()

  return (
    <>
      <AgentPage />
    </>
  )
}

export const App = ExploreApp
