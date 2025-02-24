# Looker Explore Assistant

This is an extension or API plugin for Looker that integrates LLM's hosted on Vertex AI into a natural language experience powered by Looker's modeling layer.

## Description

The Explore Assistant allows a user to generate a Looker Explore Query via natural language outputted into a visualization. As opposed to writing the raw SQL itself, the LLM is optimized to translate a text input into a Looker explore query. This is important as the LLM does what it's great at, **generative content**, and Looker powers it with all the **underlying data context, metadata and nuances** that come with business data and analytics.

Additionally, the extension provides:

- Question History (_this is stored in the browser's localstorage_)
- Categorized Prompts (_these can be customized by the use cases of your organization_)
- Cached Explore URL's when clicking from History
- Multi-turn
- Insight Summarization
- Dynamic Explore Selection

### Technologies Used

#### Frontend

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Webpack](https://webpack.js.org/).
- [Tailwind CSS](https://tailwindcss.com/)

#### Looker

- [Looker Extension SDK](https://github.com/looker-open-source/sdk-codegen/tree/main/packages/extension-sdk-react)
- [Looker Embed SDK](https://cloud.google.com/looker/docs/embed-sdk)
- [Looker Components](https://cloud.google.com/looker/docs/components)

#### Backend API

- [Google Cloud Platform](https://cloud.google.com/)
- [Vertex AI](https://cloud.google.com/vertex-ai)
- [Cloud Functions](https://cloud.google.com/functions)

## Get Started

Getting started involves (_in this order_):

1. Installing the [Gemini backend](https://github.com/datadriven-works/gemini-backend.git) -- this is a Gemini proxy that is hosted as a Cloud Fucntion in a google project in your account. The explore assistant will use this to generate responses. As part of this process you will have:
   - the URL of your cloud function endpoint
   - the shared secret (auth token) that we use to secure the endpoint
2. Clone or download a copy of this repository to your development machine.
   If you have a git ssh_config:

   ```bash
   # cd ~/ Optional. your user directory is usually a good place to git clone to.
   git clone git@github.com:datadriven-works/looker-explore-assistant-pro.git
   ```

   If not:

   ```bash
   # cd ~/ Optional. your user directory is usually a good place to git clone to.
   git clone https://github.com/datadriven-works/looker-explore-assistant-pro.git
   ```

3. Populate the .env file with the cloud function and auth tokens
4. Build the explore assistant
5. Upload the build file to your looker instance and update the Lookml manifest.

## Setup

1. Backend Setup - setup the GCP backend for communicating with the Vertex API [using these instructions.](https://github.com/datadriven-works/gemini-backend/blob/main/README.md)
2. Frontend Setup - setup Looker Extension Framework Applications by following [these instructions](./extension/README.md).
