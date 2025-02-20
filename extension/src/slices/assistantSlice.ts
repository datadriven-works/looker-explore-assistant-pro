import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

export interface ExploreParams {
  fields?: string[]
  filters?: Record<string, string>
  pivots?: string[]
  vis_config?: any
  sorts?: string[]
  limit?: string
  filter_expression?: string
}

export interface Setting {
  name: string
  description: string
  value: boolean
}

export interface Settings {
  [key: string]: Setting
}

export interface ExploreDefinition {
  exploreKey: string
  modelName: string
  exploreId: string
  samples: string[]
}

export interface ExploreExamples {
  [exploreKey: string]: {
    input: string
    output: string
  }[]
}

export interface RefinementExamples {
  [exploreKey: string]: {
    input: string[]
    output: string
  }[]
}

interface Field {
  name: string
  type: string
  description: string
  tags: string[]
}

export interface TextMessage {
  uuid: string
  actor: 'user' | 'model'
  createdAt: number
  message: string
  type: 'text'
}

export interface FunctionCall {
  uuid: string
  name: string
  args: any
  createdAt: number
  type: 'functionCall'
}

export interface FunctionResponse {
  uuid: string
  callUuid: string
  name: string
  response: any
  createdAt: number
  type: 'functionResponse'
}

export type ChatMessage = TextMessage | FunctionCall | FunctionResponse

export type ExploreThread = {
  uuid: string
  exploreId: string
  modelName: string
  exploreKey: string
  messages: ChatMessage[]
  exploreParams: ExploreParams
  summarizedPrompt: string
  promptList: string[]
  createdAt: number
}


export interface SemanticModel {
  dimensions: Field[]
  measures: Field[]
  exploreKey: string
  exploreId: string
  modelName: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  group_ids: string[]
}

export interface AssistantState {
  isQuerying: boolean
  isChatMode: boolean
  currentExploreThread: ExploreThread | null
  currentExplore: {
    exploreKey: string
    modelName: string
    exploreId: string
  }
  user: User | null
  exploreAssistantConfig: ExploreAssistantConfig | null
  sidePanel: {
    isSidePanelOpen: boolean
    exploreParams: ExploreParams
  }
  history: ExploreThread[]
  semanticModels: {
    [exploreKey: string]: SemanticModel
  }
  query: string
  examples: {
    exploreGenerationExamples: ExploreExamples
    exploreRefinementExamples: RefinementExamples
  },
  explores: ExploreDefinition[],
  settings: Settings,
  isMetadataLoaded: boolean,
  isSemanticModelLoaded: boolean
}

export const newThreadState = () => {
  const thread: ExploreThread = {    
    uuid: uuidv4(),
    exploreKey: '',
    exploreId: '',
    modelName: '',
    messages: [],
    exploreParams: {},
    summarizedPrompt: '',
    promptList: [],
    createdAt: Date.now()
  }
  return thread
}

export interface ExploreAssistantConfig {
  sample_prompts?: Record<string, string[]>
  explore_whitelist?: string[]
  explore_blacklist?: string[]
  allowed_looker_group_ids?: string[]
}

export const initialState: AssistantState = {
  isQuerying: false,
  isChatMode: false,
  currentExploreThread: null,
  currentExplore: {
    exploreKey: '',
    modelName: '',
    exploreId: ''
  },
  user: null,
  exploreAssistantConfig: null,
  sidePanel: {
    isSidePanelOpen: false,
    exploreParams: {},
  },
  history: [],
  query: '',
  semanticModels: {},
  examples: {
    exploreGenerationExamples: {},
    exploreRefinementExamples: {},
  },
  explores: [],
  settings: {
    show_explore_data: {
      name: 'Show Explore Data',
      description: 'By default, expand the data panel in the Explore',
      value: false,
    },
  },
  isMetadataLoaded: false,
  isSemanticModelLoaded: false
}

export const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    resetExploreAssistant: () => {
      return initialState
    },
    setIsQuerying: (state, action: PayloadAction<boolean>) => {
      state.isQuerying = action.payload
    },
    setIsChatMode: (state, action: PayloadAction<boolean>) => {
      state.isChatMode = action.payload
    },
    resetChatMode: (state) => {
      state.isChatMode = false
      assistantSlice.caseReducers.resetChat(state)
    },
    resetSettings: (state) => {
      state.settings = initialState.settings
    },
    setSetting: (
      state,
      action: PayloadAction<{ id: keyof Settings; value: boolean }>,
    ) => {
      const { id, value } = action.payload
      if (state.settings[id]) {
        state.settings[id].value = value
      }
    },
    openSidePanel: (state) => {
      state.sidePanel.isSidePanelOpen = true
    },
    closeSidePanel: (state) => {
      state.sidePanel.isSidePanelOpen = false
    },
    setSidePanelExploreParams: (state, action: PayloadAction<ExploreParams>) => {
      state.sidePanel.exploreParams = action.payload
    },
    clearHistory : (state) => {
      state.history = []
    },
    setExploreAssistantConfig: (state, action: PayloadAction<ExploreAssistantConfig>) => {
      state.exploreAssistantConfig = action.payload
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
    updateLastHistoryEntry: (state) => {
      if (state.currentExploreThread === null) {
        return
      }

      if (state.history.length === 0) {
        state.history.push({ ...state.currentExploreThread })
      } else {
        const currentUuid = state.currentExploreThread.uuid
        const lastHistoryUuid = state.history[state.history.length - 1].uuid
        if (currentUuid !== lastHistoryUuid) {
          state.history.push({ ...state.currentExploreThread })
        } else {
          state.history[state.history.length - 1] = state.currentExploreThread
        }
      }
    },
    setSemanticModels: (state, action: PayloadAction<AssistantState['semanticModels']>) => {
      state.semanticModels = action.payload
    },
    setExploreParams: (state, action: PayloadAction<ExploreParams>) => {
      if (state.currentExploreThread === null) {
        state.currentExploreThread = newThreadState()
      }
      state.currentExploreThread.exploreParams = action.payload
    },
    updateCurrentThread: (
      state,
      action: PayloadAction<Partial<ExploreThread>>,
    ) => {
      if (state.currentExploreThread === null) {
        state.currentExploreThread = newThreadState()
      }
      state.currentExploreThread = {
        ...state.currentExploreThread,
        ...action.payload,
      }
    },
    setCurrentThread: (state, action: PayloadAction<ExploreThread>) => {
      state.currentExploreThread = { ...action.payload }
    },
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload
    },
    resetChat: (state) => {
      state.currentExploreThread = newThreadState()
      state.currentExploreThread.uuid = uuidv4()
      state.query = ''
      state.isChatMode = false
      state.isQuerying = false
      state.sidePanel = initialState.sidePanel
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (state.currentExploreThread === null) {
        state.currentExploreThread = newThreadState()
      }
      if (action.payload.uuid === undefined) {
        action.payload.uuid = uuidv4()
      }
      state.currentExploreThread.messages.push(action.payload)
    },
    setExploreGenerationExamples(
      state,
      action: PayloadAction<AssistantState['examples']['exploreGenerationExamples']>,
    ) {
      state.examples.exploreGenerationExamples = action.payload
    },
    setExplores(
      state,
      action: PayloadAction<ExploreDefinition[]>,
    ) {
      state.explores = action.payload
    },
    setIsMetadataLoaded: (
      state, 
      action: PayloadAction<boolean>
    ) => {
      state.isMetadataLoaded = action.payload
    },
    setIsSemanticModelLoaded: (state, action: PayloadAction<boolean>) => {
      state.isSemanticModelLoaded = action.payload
    },
    setCurrenExplore: (state, action: PayloadAction<AssistantState['currentExplore']>) => {
      state.currentExplore = action.payload
    },
    updateSummarizedPrompt: (state, action: PayloadAction<{ uuid: string; summary: string }>) => {
      const { uuid, summary } = action.payload
      state.history = state.history.map((thread) => {
        if (thread.uuid === uuid) {
          return {
            ...thread,
            summarizedPrompt: summary
          }
        }
        return thread
      })
    }
  },
})

export const {
  setIsQuerying,
  setIsChatMode,
  resetChatMode,

  updateLastHistoryEntry,
  clearHistory,

  setSemanticModels,
  setIsSemanticModelLoaded,
  setExploreParams,
  setQuery,
  resetChat,
  addMessage,
  setExploreGenerationExamples,
  setExplores,

  updateCurrentThread,
  setCurrentThread,

  openSidePanel,
  closeSidePanel,
  setSidePanelExploreParams,

  setIsMetadataLoaded,

  setSetting,
  resetSettings,

  updateSummarizedPrompt,
  setCurrenExplore,

  resetExploreAssistant,
  setExploreAssistantConfig,
  setUser,
} = assistantSlice.actions

export default assistantSlice.reducer
