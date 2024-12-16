import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import PromptInput from './PromptInput'
import Sidebar from './Sidebar'
import { v4 as uuidv4 } from 'uuid'

import './style.css'
import SamplePrompts from '../../components/SamplePrompts'
import { ExploreEmbed } from '../../components/ExploreEmbed'
import { RootState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'

import {
  addMessage,
  AssistantState,
  closeSidePanel,
  setCurrenExplore,
  setIsQuerying,
  setQuery,
  updateCurrentThread,
  updateLastHistoryEntry,
  ChatMessage,
  TextMessage,
  FunctionCall,
  FunctionResponse,
} from '../../slices/assistantSlice'
import MessageThread from './MessageThread'
import clsx from 'clsx'
import CloseIcon from '@mui/icons-material/Close'
import {
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material'
import { getRelativeTimeString } from '../../utils/time'
import { useGenerateContent } from '../../hooks/useGenerateContent'
import { formatRow } from '../../hooks/useGenerateContent'
import { ExploreHelper } from '../../utils/ExploreHelper'
import { ExtensionContext } from '@looker/extension-sdk-react'

const exploreRequestBodySchema = {
  fields: { type: 'ARRAY', items: { type: 'STRING' }, description: 'The fields to include in the explore' },
  filters: { type: 'OBJECT', description: 'The filters to apply to the explore. The keys are the dimensions and measures defined in the semantic model.' },
  filter_expression: { type: 'STRING', description: 'A filter expression to apply to the explore. This is a SQL-like expression that will be used to filter the data in the explore.' },
  sorts: { type: 'ARRAY', items: { type: 'STRING' }, description: 'The sorts to apply to the explore' },
  limit: { type: 'INTEGER', description: 'The limit to apply to the explore' },
  vis_config: { type: 'OBJECT', description: 'The visualization configuration to apply to the explore' },
  pivots: { type: 'ARRAY', items: { type: 'STRING' }, description: 'The fields to pivot by. They must also be in the fields array.' },
  model: { type: 'STRING', description: 'The model to use for the explore' },
  view: { type: 'STRING', description: 'The view to use for the explore' },
}

const toCamelCase = (input: string): string => {
  // Remove underscores, make following letter uppercase
  let result = input.replace(/_([a-z])/g, (_match, letter) => ' ' + letter.toUpperCase())

  // Capitalize the first letter of the string
  result = result.charAt(0).toUpperCase() + result.slice(1)

  return result
}

const generateHistory = (messages: ChatMessage[]) => {
  const history: any[] = []
  messages.forEach((oneMessage: ChatMessage) => {
    const parts = []
    let role = ''
    if (oneMessage.type === 'functionCall') {
      role = 'model'

      parts.push({
        functionCall: {
          id: oneMessage.uuid,
          name: oneMessage.name,
          args: oneMessage.args || {},
        },
      })
    } else if (oneMessage.type === 'text') {
      role = oneMessage.actor
      parts.push(oneMessage.message)
    } else if (oneMessage.type === 'functionResponse') {
      role = 'user'
      parts.push({
        functionResponse: {
          id: oneMessage.callUuid,
          name: oneMessage.name,
          response: {
            name: oneMessage.name,
            content: oneMessage.response,
          },
        },
      })
    }

    history.push({
      role,
      parts,
    })
  })

  return history
}

const AgentPage = () => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null) // Ref for the last message
  const dispatch = useDispatch()
  const [expanded, setExpanded] = useState(false)
  const { generateContent, generateExploreQuery, summarizeData } = useGenerateContent()
  const { extensionSDK, core40SDK } = useContext(ExtensionContext)
  const hostUrl = extensionSDK.lookerHostData?.hostUrl
  const hostName = hostUrl ? new URL(hostUrl).hostname : ''

  const {
    isChatMode,
    query,
    isQuerying,
    currentExploreThread,
    currentExplore,
    sidePanel,
    examples,
    semanticModels,
    isBigQueryMetadataLoaded,
    isSemanticModelLoaded,
  } = useSelector((state: RootState) => state.assistant as AssistantState)

  const explores = Object.keys(examples.exploreSamples).map((key) => {
    const exploreParts = key.split(':')
    return {
      exploreKey: key,
      modelName: exploreParts[0],
      exploreId: exploreParts[1],
    }
  })

  const scrollIntoView = useCallback(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [endOfMessagesRef])

  useEffect(() => {
    scrollIntoView()
  }, [currentExploreThread, query, isQuerying])


  const submitMessage = useCallback(async () => {
    if (query === '') {
      return
    }
  
    dispatch(setIsQuerying(true))
  
    const exploreKey = currentExploreThread?.exploreKey || currentExplore.exploreKey
    const { dimensions, measures } = semanticModels[exploreKey]

    // Set the explore if it is not set
    if (!currentExploreThread?.modelName || !currentExploreThread?.exploreId) {
      dispatch(
        updateCurrentThread({
          exploreId: currentExplore.exploreId,
          modelName: currentExplore.modelName,
          exploreKey: currentExplore.exploreKey,
        })
      )
    }
  
    const contentList: ChatMessage[] = [...(currentExploreThread?.messages || [])]
  
    const initialMessage: TextMessage = {
      uuid: uuidv4(),
      message: query,
      actor: 'user',
      createdAt: Date.now(),
      type: 'text',
    }
  
    dispatch(addMessage(initialMessage))
    contentList.push(initialMessage)
  
    const tools = [
      {
        name: 'get_time',
        description: 'Get the current time',
        parameters: {
          type: 'OBJECT',
          properties: {
            time_zone: {
              type: 'STRING',
              description:
                'The time zone to get the time in. Use the IANA Time Zone Database format.',
            },
          },
        },
      },
      {
        name: 'get_explore_query',
        description: 'Generate the request body to a Looker explore that answers the user question. The request body will be compatible with the Looker API endpoints for run_inline_query. It will use the dimensions/measures defined in the semantic model to create the explore. This will also trigger the embedding of the explore in the UI for the user to view. Use this function to either generate the explore query body, or to show the user a visualization of the explore in the UI.',
        parameters: {
          type: 'OBJECT',
          properties: {
            user_request: {
              type: 'STRING',
              description: 'The user request to transform into a Looker explore',
            },
          },
          required: ['user_request'],
        },
      },
      {
        name: 'get_explore_link',
        description: 'Generate the URL for a Looker explore based on a valid request body that is compatible with the Looker API endpoints for run_inline_query. This will return a full qualified URL that can be used to view the explore in Looker. Only provide a request body that was generated by the get_explore_query tool.',
        parameters: {
          type: 'OBJECT',
          properties: {
            request_body: {
              type: 'OBJECT',
              description: 'The request body to generate a URL for',
              properties: exploreRequestBodySchema
            },
          },
          required: ['request_body'],
        },
      },
      {
        name: 'get_data_analysis',
        description: 'Generate a summary of the data in the explore. We will fetch the data from the explore, and create a summary in markdown format. You must supply a valid request body that is compatible with the Looker API endpoints for run_inline_query.',
        parameters: {
          type: 'OBJECT',
          properties: {
            request_body: {
              type: 'OBJECT',
              description: 'The request body to generate a summary for',
              properties: exploreRequestBodySchema
            },
          },
          required: ['request_body'],
        },
      },
      { 
        name: 'get_data_sample',
        description: 'Generate a sample of the data in the explore. We will fetch the data from the explore, and create a sample. You must supply a valid request body that is compatible with the Looker API endpoints for run_inline_query.',
        parameters: {
          type: 'OBJECT',
          properties: {
            request_body: {
              type: 'OBJECT',
              description: 'The request body to generate a sample for',
            },
          },
        },
      }
    ]  
    
    const systemInstruction = `You are a helpful assistant that is inside of Looker. Your job is to help me answer questions about this data set ${currentExploreThread?.exploreKey}. The model is ${currentExplore.modelName} and the explore is ${currentExplore.exploreId}. If you make links to an explore, they should look like https://${hostName}/explore/${currentExplore.modelName}/${currentExplore.exploreId}. If you're generating a link to an explore, prefer to use the get_explore_link tool instead of trying to generate it yourself. Try not to make the text of the link the full URL, but try to describe the explore in a way that is easy to understand.

    If you're asked to generate a summary or analysis, use the get_data_analysis tool. Return the analysis in markdown format that was provided to you by the get_data_analysis tool. Don't include the JSON, just the markdown text.
    
    Here are the dimensions and measures that are defined in this data set:
     | Field Id | Field Type | LookML Type | Label | Description | Tags |
     |------------|------------|-------------|-------|-------------|------|
     ${dimensions.map(formatRow).join('\n')}
     ${measures.map(formatRow).join('\n')}
    

    Return text in markdown format. When showing links, use the markdown link format.
    `
  
    // We'll do up to 10 rounds of evaluation in case there are multiple function calls
    const maxRounds = 3
    let round = 0
  
    while (round < maxRounds) {
      // Generate a response from the current conversation state
      const response = await generateContent({
        contents: generateHistory(contentList),
        tools,
        systemInstruction,
      })
  
      // Process any textual responses
      let responseText = ''
      response.forEach((oneResponse: any) => {
        if (oneResponse.text) {
          responseText += oneResponse.text
        }
      })
  
      if (responseText && responseText.trim() !== '') {
        const textMessage: TextMessage = {
          uuid: uuidv4(),
          message: responseText,
          actor: 'model',
          createdAt: Date.now(),
          type: 'text',
        }
        dispatch(addMessage(textMessage))
        contentList.push(textMessage)
      }
  
      // Find function calls in the response
      const functionCalls = response.filter(
        (oneResponse: any) => oneResponse.functionCall !== undefined
      )
  
      if (functionCalls.length === 0) {
        // No function calls, we can break out of the loop
        break
      }
  
      // Handle all function calls
      for (const oneFunctionCall of functionCalls) {
        const functionName = oneFunctionCall.functionCall.name
        const functionArguments = oneFunctionCall.functionCall.args
  
        const functionCallMessage: FunctionCall = {
          uuid: uuidv4(),
          name: functionName,
          args: functionArguments,
          createdAt: Date.now(),
          type: 'functionCall',
        }
        dispatch(addMessage(functionCallMessage))
        contentList.push(functionCallMessage)
  
        // Handle known tools here:
        if (functionName === 'get_time') {
          const timeZone =
            functionArguments?.time_zone ||
            window.Intl.DateTimeFormat().resolvedOptions().timeZone
          const time = new Date().toLocaleString('en-US', { timeZone })
          const functionResponseMessage: FunctionResponse = {
            uuid: uuidv4(),
            callUuid: functionCallMessage.uuid,
            name: functionName,
            response: `The time in ${timeZone} is ${time}`,
            createdAt: Date.now(),
            type: 'functionResponse',
          }
          dispatch(addMessage(functionResponseMessage))
          contentList.push(functionResponseMessage)
        } else if (functionName === 'get_explore_query') {

          const response = await generateExploreQuery({
            userRequest: functionArguments.user_request,
            modelName: currentExplore.modelName,
            exploreId: currentExplore.exploreId,
            dimensions,
            measures,
            examples: examples.exploreGenerationExamples,
          })

          const functionResponseMessage: FunctionResponse = {
            uuid: uuidv4(),
            callUuid: functionCallMessage.uuid,
            name: functionName,
            response: response,
            createdAt: Date.now(),
            type: 'functionResponse',
          }
          dispatch(addMessage(functionResponseMessage))
          contentList.push(functionResponseMessage)
        } else if (functionName === 'get_explore_link') {

          const params = ExploreHelper.encodeExploreParams(functionArguments.request_body)
          params.toggle = 'vis,data'
          const paramString = new URLSearchParams(params).toString()
          const uri = `https://${hostName}/explore/${currentExplore.modelName}/${currentExplore.exploreId}?${paramString}`

          const functionResponseMessage: FunctionResponse = {
            uuid: uuidv4(),
            callUuid: functionCallMessage.uuid,
            name: functionName,
            response: uri,
            createdAt: Date.now(),
            type: 'functionResponse',
          }

          dispatch(addMessage(functionResponseMessage))
          contentList.push(functionResponseMessage)
        } else if (functionName === 'get_data_analysis') {
         // get all the data and create a summary

         const data = await ExploreHelper.getData(functionArguments.request_body, core40SDK)

         const summary = await summarizeData(data)

          // run the query and respond with the data
          const functionResponseMessage: FunctionResponse = {
            uuid: uuidv4(),
            callUuid: functionCallMessage.uuid,
            name: functionName,
            response: summary,
            createdAt: Date.now(),
            type: 'functionResponse',
          }

          dispatch(addMessage(functionResponseMessage))
          contentList.push(functionResponseMessage)

        } else if (functionName === 'get_data_sample') {

          const data = await ExploreHelper.getData(functionArguments.request_body, core40SDK)

          // run the query and respond with the data
          const functionResponseMessage: FunctionResponse = {
            uuid: uuidv4(),
            callUuid: functionCallMessage.uuid,
            name: functionName,
            response: data,
            createdAt: Date.now(),
            type: 'functionResponse',
          }

          dispatch(addMessage(functionResponseMessage))
          contentList.push(functionResponseMessage)
        }
        // If you add more tools, handle them similarly here
      }

      // After handling function calls, loop again to let the model react to the function responses
      round++
    }
  
    dispatch(setIsQuerying(false))
    dispatch(setQuery(''))
  
    // scroll to bottom of message thread
    scrollIntoView()
  
    // update the history with the current contents of the thread
    dispatch(updateLastHistoryEntry())
  }, [query, semanticModels, examples, currentExplore, currentExploreThread])
  
  const isDataLoaded = isBigQueryMetadataLoaded && isSemanticModelLoaded

  useEffect(() => {
    if (!query || query === '' || !isDataLoaded) {
      return
    }

    submitMessage()
    scrollIntoView()
  }, [query, isDataLoaded])

  const toggleDrawer = () => {
    setExpanded(!expanded)
  }

  const handleExploreChange = (event: SelectChangeEvent) => {
    const exploreKey = event.target.value
    const [modelName, exploreId] = exploreKey.split(':')
    dispatch(
      setCurrenExplore({
        modelName,
        exploreId,
        exploreKey,
      })
    )
  }

  const isAgentReady = isBigQueryMetadataLoaded && isSemanticModelLoaded

  if (!isAgentReady) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <div className="flex flex-col space-y-4 mx-auto max-w-2xl p-4">
          <h1 className="text-5xl font-bold">
            <span className="bg-clip-text text-transparent  bg-gradient-to-r from-pink-500 to-violet-500">
              Hello.
            </span>
          </h1>
          <h1 className="text-3xl text-gray-400">Getting everything ready...</h1>
          <div className="max-w-2xl text-blue-300">
            <LinearProgress color="inherit" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative page-container flex h-screen w-full">
      <Sidebar expanded={expanded} toggleDrawer={toggleDrawer} />

      <main
        className={`flex-grow flex flex-col transition-all duration-300 ${
          expanded ? 'ml-80' : 'ml-16'
        } h-screen`}
      >
        <div className="flex-grow">
          {isChatMode && (
            <div className="z-10 flex flex-row items-start text-xs fixed inset w-full h-10 pl-2 bg-gray-50 border-b border-gray-200">
              <ol
                role="list"
                className="flex w-full max-w-screen-xl space-x-4 px-4 sm:px-6 lg:px-4"
              >
                <li className="flex">
                  <div className="flex items-center">Explore Assistant</div>
                </li>

                <li className="flex">
                  <div className="flex items-center h-10 ">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 44 44"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      className="h-full w-6 flex-shrink-0 text-gray-300"
                    >
                      <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
                    </svg>
                    <div className="ml-4 text-xs font-medium text-gray-500 hover:text-gray-700">
                      {toCamelCase(currentExploreThread?.exploreId || '')}
                    </div>
                  </div>
                </li>

                <li className="flex">
                  <div className="flex items-center h-10">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 44 44"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      className="h-full w-6 flex-shrink-0 text-gray-300"
                    >
                      <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
                    </svg>
                    <div className="ml-4 text-xs font-medium text-gray-500 hover:text-gray-700">
                      Chat (started{' '}
                      {getRelativeTimeString(
                        currentExploreThread?.createdAt
                          ? new Date(currentExploreThread.createdAt)
                          : new Date()
                      )}
                      )
                    </div>
                  </div>
                </li>
              </ol>
            </div>
          )}
          {isChatMode ? (
            <div className="relative flex flex-row h-screen px-4 pt-6 ">
              <div
                className={clsx(
                  'flex flex-col relative',
                  sidePanel.isSidePanelOpen ? 'w-2/5' : 'w-full'
                )}
              >
                <div className="flex-grow overflow-y-auto max-h-full mb-36 ">
                  <div className="max-w-4xl mx-auto mt-8">
                    <MessageThread endOfMessageRef={endOfMessagesRef} />
                  </div>
                </div>
                <div
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4/5  transition-all duration-300 ease-in-out`}
                >
                  <PromptInput />
                </div>
              </div>

              <div
                className={clsx(
                  'flex-grow flex flex-col pb-2 pl-2 pt-8 transition-all duration-300 ease-in-out transform max-w-0',
                  sidePanel.isSidePanelOpen
                    ? 'max-w-full translate-x-0 opacity-100'
                    : 'translate-x-full opacity-0'
                )}
              >
                <div className="flex flex-row bg-gray-400 text-white rounded-t-lg px-4 py-2 text-sm">
                  <div className="flex-grow">Explore</div>
                  <div className="">
                    <Tooltip title="Close Explore" placement="bottom" arrow>
                      <button
                        onClick={() => dispatch(closeSidePanel())}
                        className="text-white hover:text-gray-300"
                      >
                        <CloseIcon />
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="bg-gray-200 border-l-2 border-r-2 border-gray-400 flex-grow">
                  <ExploreEmbed
                    modelName={currentExploreThread?.modelName}
                    exploreId={currentExploreThread?.exploreId}
                    exploreParams={sidePanel.exploreParams}
                  />
                </div>
                <div className="bg-gray-400 text-white px-4 py-2 text-sm rounded-b-lg"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-4 mx-auto max-w-3xl p-4">
                <h1 className="text-5xl font-bold">
                  <span className="bg-clip-text text-transparent  bg-gradient-to-r from-pink-500 to-violet-500">
                    Hello.
                  </span>
                </h1>
                <h1 className="text-5xl text-gray-400">How can I help you today?</h1>
              </div>

              <div className="flex flex-col max-w-3xl m-auto mt-16">
                {explores.length > 1 && (
                  <div className="text-md border-b-2 p-2 max-w-3xl">
                    <FormControl className="">
                      <InputLabel>Explore</InputLabel>
                      <Select
                        value={currentExplore.exploreKey}
                        label="Explore"
                        onChange={handleExploreChange}
                      >
                        {explores.map((oneExplore) => (
                          <MenuItem key={oneExplore.exploreKey} value={oneExplore.exploreKey}>
                            {toCamelCase(oneExplore.exploreId)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                )}
                <SamplePrompts />
              </div>

              <div
                className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 transition-all duration-300 ease-in-out
                            ${expanded ? 'pl-80' : ''} `}
              >
                <PromptInput />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default AgentPage
