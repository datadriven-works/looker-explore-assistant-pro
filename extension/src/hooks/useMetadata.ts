
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getCore40SDK } from '@looker/extension-sdk-react'
import {
  setExplores,
  setIsMetadataLoaded,
  setCurrenExplore,
  ExploreDefinition,
  setExploreAssistantConfig,
  setUser,
} from '../slices/assistantSlice'
import { RootState } from '../store'

export const useMetadata = () => {
  const dispatch = useDispatch()
  const sdk = getCore40SDK()

  const { exploreAssistantConfig } = useSelector((state: RootState) => state.assistant)
  const loadConfig = async () => {
    try {
      const config = await import('../config/explore_config.yaml')
      dispatch(setExploreAssistantConfig(config.default))
    } catch {
      console.log('No custom explore config found, using default empty config')
      dispatch(setExploreAssistantConfig({}))
    }
  }




  const getExplores = async () => {
    try {
      // Fetch all explores from Looker
      const allModels = await sdk.ok(sdk.all_lookml_models({
        fields: 'name,label,description,explores'
      }))

      const definedExplores: ExploreDefinition[] = []
      
      // Iterate through models to get their explores
      for (const model of allModels) {
        const explores = model.explores
        if(!explores || explores.length === 0) {
          continue
        }

        for (const oneExplore of explores) {
          const oneExploreKey = `${model.name}:${oneExplore.name}`
          if(exploreAssistantConfig?.explore_blacklist?.includes(oneExploreKey)) {
            continue
          }

          // check for samples in the config
          const samples = exploreAssistantConfig?.sample_prompts?.[oneExploreKey] || []


          // if there is a whilte list, only add the explore if it is in the whitelist
          if(exploreAssistantConfig?.explore_whitelist && exploreAssistantConfig?.explore_whitelist?.length > 0) {
            if(!exploreAssistantConfig?.explore_whitelist?.includes(oneExploreKey)) {
              continue
            }

            definedExplores.push({
              exploreKey: oneExploreKey,
              modelName: model.name!,
              exploreId: oneExplore.name || '',
              samples: samples
            })
          } else {
            definedExplores.push({
              exploreKey: oneExploreKey,
              modelName: model.name!,
              exploreId: oneExplore.name || '',
              samples: samples
            })
          }
        }
      }

      // sort the defined explores by the explore name
      definedExplores.sort((a, b) => a.exploreId.localeCompare(b.exploreId))

      dispatch(setExplores(definedExplores))
      
      // Set the first explore as current if available
      const firstExplore = definedExplores[0]
      if (firstExplore) {
        const {exploreKey, exploreId, modelName} = firstExplore
        dispatch(setCurrenExplore({
          exploreKey,
          modelName,
          exploreId
        }))
      }
    } catch (error) {
      console.error('Error fetching explores:', error)
    }
  }

  const getUser = async () => {
    const user = await sdk.ok(sdk.me())
    dispatch(setUser({
      id: user.id || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      group_ids: user.group_ids || []
    }))
  }

  useEffect(() => {
    loadConfig()
  },[])

  useEffect(() => {
    if(!exploreAssistantConfig) {
      return
    }

    Promise.all([
      getExplores(),
      getUser()
    ]).finally(() => {
      dispatch(setIsMetadataLoaded(true))
    })
  }, [exploreAssistantConfig])
}
