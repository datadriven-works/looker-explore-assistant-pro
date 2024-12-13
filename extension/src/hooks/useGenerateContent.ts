import { ModelParameters } from '../utils/VertexHelper'
import CryptoJS from 'crypto-js'
import { formatRow } from './useSendVertexMessage'
import { ExploreExamples } from '../slices/assistantSlice'
import looker_filter_doc from '../documents/looker_filter_doc.md'
import looker_visualization_doc from '../documents/looker_visualization_doc.md'
import looker_query_body from '../documents/looker_query_body.md'
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

    Your job is to generate a request body that is compatible with the Looker API endpoints for run_inline_query. You will do the following:
    * fields - figure out which fields need to be included
    * filters - based on the user question, figure out which filters need to be applied
    * filter_expression - based on the user question, figure out which filter expression needs to be applied
    * pivots - figure out which fields need to be pivoted by
    * sorts - figure out which fields need to be sorted by
    * vis_config - figure out which visualization needs to be applied
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

    const queryBodyDocumentation = `
     ${looker_query_body}
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
        parts: [queryBodyDocumentation],
      },
      {
        role: 'user',
        parts: [`Generate the query body that answers the request: ${prompt}`],
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
        filter_expression: { type: 'STRING', description: 'A filter expression to apply to the explore. This is a SQL-like expression that will be used to filter the data in the explore.' },
        row_total: { type: 'STRING', description: 'Raw Total', default: '' },
        vis_config: {
          type: 'OBJECT',
          description: 'Visualization configuration properties in JSON format',
        },
        fields: { type: 'ARRAY', items: { type: 'STRING' }, default: [] },
        filters: { type: 'OBJECT', description: 'The filters to apply to the explore. The keys are the dimensions and measures defined in the semantic model. The values are the filter values. Use the documentation how to use filters in Looker.' },
        sorts: { type: 'ARRAY', items: { type: 'STRING' }, default: [] },
        limit: { type: 'INTEGER', default: 500 },
      },
      required: ['model', 'view', 'fields', 'filters', 'limit', 'vis_config']
    }

    const response = await generateContent({
      contents,
      systemInstruction,
      responseSchema,
    })
    console.log('Generate Explore Query Response', response)
    const exploreDefinition = response[0]['object']
    exploreDefinition['model'] = modelName
    exploreDefinition['view'] = exploreId
    return exploreDefinition
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
