import React, { useContext, useEffect, useState } from 'react'
import { useLookerFields } from './hooks/useLookerFields'
import { useBigQueryExamples } from './hooks/useBigQueryExamples'
import AgentPage from './pages/AgentPage'
import { ExtensionContext } from '@looker/extension-sdk-react'
import { NotAuthorized } from './components/NotAuthorized'
import { Loading } from './components/Loading'

const ExploreApp = () => {
  const { core40SDK } = useContext(ExtensionContext)
  // load dimensions, measures and examples into the state
  useLookerFields()
  useBigQueryExamples()

  const [loading, setLoading] = useState(true)
  const [userGroups, setUserGroups] = useState<string[]>([])
  const allowedGroups = process.env.ALLOWED_LOOKER_GROUP_IDS?.split(',')

  // get the current user
  useEffect(() => {
    core40SDK.ok(core40SDK.me()).then((user) => {
      if (user.group_ids) {
        setUserGroups(user.group_ids)
      }
      setLoading(false)
    })
  }, [core40SDK])

  const isAllowed = !allowedGroups || userGroups.some((group) => allowedGroups?.includes(group))

  return (
    <>
      {loading ? <Loading /> : isAllowed ? <AgentPage /> : <NotAuthorized />}
    </>
  )
}

export const App = ExploreApp
