import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { getCore40SDK } from '@looker/extension-sdk-react'
import {
  setExploreGenerationExamples,
  setExplores,
  setIsMetadataLoaded,
  setCurrenExplore,
  ExploreExamples,
  ExploreDefinition,
} from '../slices/assistantSlice'

interface ExploreConfig {
  sample_prompts?: Record<string, {input: string; output: string}[]>
  explore_whitelist?: string[]
  explore_blacklist?: string[]
}

export const useMetadata = () => {
  const dispatch = useDispatch()
  const sdk = getCore40SDK()
  const [exploreConfig, setExploreConfig] = useState<ExploreConfig | null>(null)

  const loadConfig = async () => {
    try {
      const config = await import('../config/explore_config.yaml')
      setExploreConfig(config.default)
    } catch {
      console.log('No custom explore config found, using default empty config')
      setExploreConfig({})
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
          if(exploreConfig?.explore_blacklist?.includes(oneExploreKey)) {
            continue
          }

          // if there is a whilte list, only add the explore if it is in the whitelist
          if(exploreConfig?.explore_whitelist && exploreConfig?.explore_whitelist?.length > 0) {
            if(!exploreConfig?.explore_whitelist?.includes(oneExploreKey)) {
              continue
            }

            definedExplores.push({
              exploreKey: oneExploreKey,
              modelName: model.name!,
              exploreId: oneExplore.name || '',
              samples: [] // TODO: add samples  
            })
          } else {
            definedExplores.push({
              exploreKey: oneExploreKey,
              modelName: model.name!,
              exploreId: oneExplore.name || '',
              samples: [] // TODO: add samples  
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

  useEffect(() => {
    loadConfig()
  },[])

  useEffect(() => {
    if(!exploreConfig) {
      return
    }

    Promise.all([
      getExplores()
    ]).finally(() => {
      dispatch(setIsMetadataLoaded(true))
    })
  }, [exploreConfig])
}
