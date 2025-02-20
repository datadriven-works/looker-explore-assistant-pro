import { useEffect } from 'react'
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

export const useMetadata = () => {
  const dispatch = useDispatch()
  const sdk = getCore40SDK()

  const getExamplePrompts = async () => {
    const generationExamples: ExploreExamples = {}
    dispatch(setExploreGenerationExamples(generationExamples))
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
          definedExplores.push({
            exploreKey: `${model.name}:${oneExplore.name}`,
            modelName: model.name!,
            exploreId: oneExplore.name || '',
            samples: []
          })
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
    Promise.all([
      getExamplePrompts(),
      getExplores()
    ]).finally(() => {
      dispatch(setIsMetadataLoaded(true))
    })
  }, [])
}
