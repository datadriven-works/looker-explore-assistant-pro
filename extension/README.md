# Explore Assistant Extension Frontend Deployment
This documentation outlines the steps required to deploy the Explore Assistant Extension with the desired backend for generating Explore URL's based on Natural Language. It assumes a Looker Instance is available with a suitable LookML Model and Explore configured.

## 1. LLM Integration

This section describes how to set up the LLM Integration for the Explore Assistant.

### Getting Started for Development

1. Install a backend using terraform by [following the instructions](https://github.com/datadriven-works/gemini-backend/blob/main/README.md)

2. Save the backend details for use by the extension framework:
   * URL of the cloud function endpoint
   * AUTH_TOKEN that you generated to secure the endpoint

## 2. Looker Extension Framework Setup
**Important** If you are not familiar with the Looker Extension Framework, please review [this documentation](https://developers.looker.com/extensions/overview/) first before moving forward.


### Getting Started for Development

1. From the Explore Assistant root directory (`cd`) to the Explore Assistant Extension folder. *If deploying from Cloudshell, you should already be in this folder*.

   ```bash
   cd extension
   ```

2. Install the dependencies with [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). *Please follow the hyperlinked directions for installing node and npm on your machine. Skip this step if deploying from Cloud Shell method above.* Additionally if you need to work across multiple Node versions, `nvm` can be used switch between and install different node versions. When installing node, you need to install a version less than 17.

   ```bash
   npm install
   ```

   > You may need to update your Node version or use a [Node version manager](https://github.com/nvm-sh/nvm) to change your Node version. You can print your version number in terminal with the following command:
   
   ```bash
   $ node -v
   ```

2. Ensure all the appropriate environment variables are set in the `.env_example` file. Also rename the `.env_example` file to `.env`. There are two sets of variables:

   The connection details for reaching gemini via the cloud function
   ```
   VERTEX_AI_ENDPOINT=<This is your Deployed Cloud Function Endpoint>
   VERTEX_CF_AUTH_TOKEN=<This is the token used to communicate with the cloud function>
   ```

   An optional list of allowed looker group ids. If the user isn't a member of any of the groups, then they won't be able to use the looker explore assistant.

   ```
   ALLOWED_LOOKER_GROUP_IDS=<The group id of the group that has access to the Looker instance>
   ```

3. Start the development server
   **IMPORTANT** If you are running the extension from a VM or another remote machine, you will need to Port Forward to the machine where you are accessing the Looker Instance from (ie. If you are accessing Looker from your local machine, run the following command there.). Here's a boilerplate example for port forwarding the remote port 8080 to the local port 8080:
   `ssh username@host -L 8080:localhost:8080`.

   ```bash
   npm run start
   ```

   Great! Your extension is now running and serving the JavaScript at https://localhost:8080/bundle.js.

4. Now log in to Looker and create a new project or use an existing project.

   This is found under **Develop** => **Manage LookML Projects** => **New LookML Project**.

   You'll want to select "Blank Project" as your "Starting Point". You'll now have a new project with no files.

   1. In your copy of the extension project you have a `manifest.lkml` file.

   You can either drag & upload this file into your Looker project, or create a `manifest.lkml` with the same content. Change the `id`, `label`, or `url` as needed. 
   **IMPORTANT** please paste in the deployed Cloud Function URL into the `external_api_urls` list and uncomment that line if you are using the Cloud Function backend deployment. This will allowlist it in Looker for fetch requests.

   ```lookml
   application: explore_assistant {
    label: "Explore Assistant"
    url: "https://localhost:8080/bundle.js"
    # file: "bundle.js"
    entitlements: {
      core_api_methods: ["lookml_model_explore","create_sql_query","run_sql_query","run_query","create_query"]
      navigation: yes
      use_embeds: yes
      use_iframes: yes
      new_window: yes
      new_window_external_urls: ["https://developers.generativeai.google/*"]
      local_storage: yes
      # external_api_urls: ["cloud function url"]
    }
   }
   ```

5. Create a `model` LookML file in your project. The name doesn't matter. The model and connection won't be used, and in the future this step may be eliminated.

   - Add a connection in this model. It can be any connection, it doesn't matter which.
   - [Configure the model you created](https://docs.looker.com/data-modeling/getting-started/create-projects#configuring_a_model) so that it has access to some connection.

6. Connect your new project to Git. You can do this multiple ways:

   - Create a new repository on GitHub or a similar service, and follow the instructions to [connect your project to Git](https://docs.looker.com/data-modeling/getting-started/setting-up-git-connection)
   - A simpler but less powerful approach is to set up git with the "Bare" repository option which does not require connecting to an external Git Service.

7. Commit your changes and deploy your them to production through the Project UI.

8.  Reload the page and click the `Browse` dropdown menu. You should see your extension in the list.
   - The extension will load the JavaScript from the `url` provided in the `application` definition. By default, this is https://localhost:8080/bundle.js. If you change the port your server runs on in the package.json, you will need to also update it in the manifest.lkml.
   - Refreshing the extension page will bring in any new code changes from the extension template, although some changes will hot reload.

### Deployment

The process above requires your local development server to be running to load the extension code. To allow other people to use the extension, a production build of the extension needs to be run. As the kitchensink uses code splitting to reduce the size of the initially loaded bundle, multiple JavaScript files are generated.

1. In your extension project directory on your development machine, build the extension by running the command `npm run build`.
1. Drag and drop ALL of the generated JavaScript file (ie. `bundle.js`) contained in the `dist` directory into the Looker project interface.
1. Modify your `manifest.lkml` to use `file` instead of `url` and point it at the `bundle.js` file.

Note that the additional JavaScript files generated during the production build process do not have to be mentioned in the manifest. These files will be loaded dynamically by the extension as and when they are needed. Note that to utilize code splitting, the Looker server must be at version 7.21 or above.

---
