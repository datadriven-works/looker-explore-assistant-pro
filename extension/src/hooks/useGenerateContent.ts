import { ModelParameters } from "../utils/VertexHelper"
import CryptoJS from 'crypto-js'

export const useGenerateContent = () => {
    // cloud function
  const VERTEX_AI_ENDPOINT = process.env.VERTEX_AI_ENDPOINT || ''
  const VERTEX_CF_AUTH_TOKEN = process.env.VERTEX_CF_AUTH_TOKEN || ''

  const sendMessage = async ({
    message,
    parameters = {},
    responseSchema = null,
    history = [],
    tools = [],
    modelName = 'gemini-2.0-flash-exp',
  }: {
    message: string,
    parameters?: ModelParameters,
    responseSchema?: any,
    history?: any[],
    tools?: any[],
    modelName?: string,
  }) => {

    const defaultParameters = {
      temperature: 2,
      max_output_tokens: 8192,
      top_p: 0.95,
    }

    if(!parameters) {
      parameters = defaultParameters
    } else {
      Object.assign(defaultParameters, parameters)
    }

    const contents = `The time is ${new Date().toISOString()} \n\n ${message}`

    const body = {
      model_name: modelName,
      contents,
      parameters: parameters,
      response_schema: null,
      history: history,
      tools: tools,
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
  
    const textResponse = await responseData.text(); // Fetch the response as text first
    
    return JSON.parse(textResponse)
  }

  return {
    sendMessage
  }
}