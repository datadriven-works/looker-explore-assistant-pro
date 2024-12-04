import React, { useEffect,useState } from 'react'
import MarkdownText from '../Chat/MarkdownText'
import Accordion from '@mui/material/Accordion'

interface ErrDiagnosis {
  diagnosis: string,
  steps: string[]
}

interface ErrDiagnosisMap {
  [key: string]: ErrDiagnosis
}

// TODO add typings for react-error-boundary
export default function Fallback({ error}: {error: any}) {
    // Call resetErrorBoundary() to reset the error boundary and retry the render.
    const [errorMessage, setErrorMessage] = useState<ErrDiagnosis | null>(null)
    const errMap: ErrDiagnosisMap = {
      lookmlNotFoundErr: {
        diagnosis: "The error is likely related to your Look specific `.env` variables.",
        steps: [
          "Make sure your user has access to this model and explore. At the very least with [`see_lookml`](https://cloud.google.com/looker/docs/admin-panel-users-roles#permissions_list) permissions.",
          "Check the Connection environment variables. Do valid BQ connections by those names exist in your Looker instance?",
          "Make sure the Vertex AI API is enabled if you're using a cloud function backend. Try: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=<YOUR_PROJECT_ID>"
        ]
      },
      lookmlExamplesUndefinedErr: {
        diagnosis: "This error is likely related to your example data and not being able to find examples for the given LookML Model and Explore in you env variables.",
        steps: [
          "First check BigQuery and the two example tables (examples and refinements). Is there a row with and explore ID that matches your `LOOKML_MODEL` & `LOOKML_EXPLORE` in the format of `LOOKML_MODEL:LOOKML_EXPLORE`?",
          "If not, please upload examples for that explore id by following the [README instructions](https://github.com/looker-open-source/looker-explore-assistant/tree/main/explore-assistant-examples).",
          "If so, find the 2 sql runner queries in Looker -> Admin -> Queries and run those manually to break any old cache. Check the Explore Assistant again."
        ]
      },
      bigQueryExamplesErr: {
        diagnosis: "The error is likely related to your BQ database and BQ `.env` variables.",
        steps: [
          "Please read the error message from BigQuery, the `SQLException` error will give you the reason.",
          "Ensure that the `BIGQUERY_EXAMPLE_PROMPTS_CONNECTION_NAME` env variable is valid and set to something that exists in Looker and that the examples can be accessed from this connection.",
          "Ensure that the `BIGQUERY_EXAMPLE_PROMPTS_DATASET_NAME` is set to the `project_id.dataset` name that contains the example tables.",
          "Ensure that examples exist in both the [Examples and Refinement tables.](https://github.com/looker-open-source/looker-explore-assistant/tree/main/explore-assistant-examples)",
          "If you are using the cloud backend, please remove VERTEX_BIGQUERY_MODEL_ID and VERTEX_BIGQUERY_EXPLORE_ID and try again."
        ]
      },
    }

    useEffect(() => {
      if(error.message) {
        if(error.message.includes("Java::NetStarschemaClouddbJdbc::BQSQLException:")){
          if(error.message.includes("Not found: Model")) {
            setErrorMessage(errMap.bigQueryModelErr)
          } else {
            setErrorMessage(errMap.bigQueryExamplesErr)
          }
        } else if (error.message.includes("Cannot read properties of undefined (reading)")) {
          setErrorMessage(errMap.lookmlExamplesUndefinedErr)
        } else {
          setErrorMessage(errMap.lookmlNotFoundErr)
        } 
          
      } 
    },[])
  
    return (
          <div className="errorContainer">
            <div className="errorBackdrop"></div>
            <div className="errorCard">
              <div className="errorHeader">
                <svg className="errorIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h2>An Error Occurred</h2>
              </div>
              <div className="errorContent">
                <div className="errorSection">
                  <h3>Error Name:</h3><MarkdownText text={errorMessage ? error.name : ''} />
                </div>
                <div className="errorSection">
                  <h3>Error Message:</h3><div className="messageContainer"><MarkdownText text={errorMessage ? error.message : ''} /></div>
                </div>
                <div className="errorSection">
                  <h3>Diagnosis:</h3>
                  <MarkdownText text={errorMessage ? errorMessage.diagnosis : ''} />
                </div>
                <div className="errorSection">

                  <ul className="troubleshootingList">
                    {errorMessage ? 
                      errorMessage.steps.map((step: string, index: number) => (
                        <li key={index}><MarkdownText text={step} /></li>
                      ))
                      :
                      <li></li>
                    }
                  </ul>
                </div>
              </div>
            </div>
          </div>
    );
  }