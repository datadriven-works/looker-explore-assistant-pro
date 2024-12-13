import { ModelParameters } from '../utils/VertexHelper'
import CryptoJS from 'crypto-js'
import { formatRow } from './useSendVertexMessage'
import { ExploreExamples } from '../slices/assistantSlice'
import looker_filter_doc from '../documents/looker_filter_doc.md'
import looker_visualization_doc from '../documents/looker_visualization_doc.md'

export const useGenerateContent = () => {
  // cloud function
  const VERTEX_AI_ENDPOINT = process.env.VERTEX_AI_ENDPOINT || ''
  const VERTEX_CF_AUTH_TOKEN = process.env.VERTEX_CF_AUTH_TOKEN || ''

  const generateExploreQuery = async ({
    userRequest,
    modelName,
    exploreId,
    dimensions,
    measures,
    examples,
  }: {
    userRequest: string
    modelName: string
    exploreId: string
    dimensions: any[]
    measures: any[]
    examples: ExploreExamples
  }) => {
    const systemInstruction = `You are a helpful assistant that generates a Looker explore request body that answers the user question. The request body will be compatible with the Looker API endpoints for run_inline_query. It will use the dimensions/measures defined in the semantic model to create the explore.
    `

    const backgroundInformation = `
    Here are the dimensions and measures that are defined in this data set:
     | Field Id | Field Type | LookML Type | Label | Description | Tags |
     |------------|------------|-------------|-------|-------------|------|
     ${dimensions.map(formatRow).join('\n')}
     ${measures.map(formatRow).join('\n')}
    `

    const filterDocumentation = `
     ${looker_filter_doc}
    `

    const visualizationDocumentation = `
     ${looker_visualization_doc}
    `

    const prompt = `${userRequest}`
    const contents = [
      {
        role: 'user',
        parts: [backgroundInformation],
      },
      {
        role: 'user',
        parts: [filterDocumentation],
      },
      {
        role: 'user',
        parts: [visualizationDocumentation],
      },
      {
        role: 'user',
        parts: [prompt],
      },
    ]

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        model: { type: 'STRING', default: modelName, description: 'Model' },
        view: { type: 'STRING', default: exploreId, description: 'Explore Name' },
        pivots: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Fields to pivot by. They must also be in the fields array.',
        },
        fill_fields: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Fields to fill' },
        row_total: { type: 'STRING', description: 'Raw Total', default: '' },
        vis_config: {
          type: 'OBJECT',
          description: 'Visualization configuration properties in JSON format',
        },
        fields: { type: 'ARRAY', items: { type: 'STRING' }, default: [] },
        filters: { type: 'OBJECT' },
        sorts: { type: 'ARRAY', items: { type: 'STRING' }, default: [] },
        limit: { type: 'INTEGER', default: 500 },
      },
      required: ['model', 'view', 'fields', 'filters', 'sorts', 'limit', 'vis_config', 'pivots'],
    }

    const response = await generateContent({
      contents,
      systemInstruction,
      responseSchema,
    })

    return response[0]['object']
  }

  const generateContent = async ({
    contents,
    parameters = {},
    responseSchema = null,
    tools = [],
    modelName = 'gemini-2.0-flash-exp',
    systemInstruction = '',
  }: {
    contents: any[]
    parameters?: ModelParameters
    responseSchema?: any
    history?: any[]
    tools?: any[]
    modelName?: string
    systemInstruction?: string
  }) => {
    const defaultParameters = {
      temperature: 2,
      max_output_tokens: 8192,
      top_p: 0.95,
    }

    if (!parameters) {
      parameters = defaultParameters
    } else {
      Object.assign(defaultParameters, parameters)
    }

    const body = {
      model_name: modelName,
      contents: '',
      parameters: parameters,
      response_schema: null,
      history: contents,
      tools: tools,
      system_instruction: systemInstruction,
    }

    if (responseSchema) {
      body['response_schema'] = responseSchema
    }

    const jsonBody = JSON.stringify(body)

    const signature = CryptoJS.HmacSHA256(jsonBody, VERTEX_CF_AUTH_TOKEN).toString()
    const path = VERTEX_AI_ENDPOINT + '/generate_content'
    const responseData = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },

      body: jsonBody,
    })

    const textResponse = await responseData.text() // Fetch the response as text first

    return JSON.parse(textResponse)
  }

  return {
    generateContent,
    generateExploreQuery,
  }
}
