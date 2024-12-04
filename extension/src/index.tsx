import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './App'
import { Provider } from 'react-redux'
import { store, persistor } from './store'
import { PersistGate } from 'redux-persist/integration/react'
import { ExtensionProvider } from '@looker/extension-sdk-react'
import { ErrorBoundary } from 'react-error-boundary'
import Fallback from './components/Error/ErrorFallback'
import { LinearProgress } from '@mui/material'

const getRoot = () => {
  const id = 'extension-root'
  const existingRoot = document.getElementById(id)
  if (existingRoot) return existingRoot
  const root = document.createElement('div')
  root.setAttribute('id', id)
  root.style.height = '100vh'
  root.style.display = 'flex'
  document.body.style.margin = '0'
  document.body.appendChild(root)
  return root
}

const render = (Component: typeof App) => {
  const root = getRoot()
  const logError = (error: Error, info: { componentStack: string }) => {
    // Do something with the error, e.g. log to an external API
    console.log('Error: ', error.name, error.message, error.stack)
    console.log('Info: ', info)
  }
  ReactDOM.render(
    <>
      <Provider store={store}>
        <PersistGate loading={<LinearProgress />} persistor={persistor}>
          <ExtensionProvider
            loadingComponent={<LinearProgress />}
            requiredLookerVersion=">=21.0"
          >
            <ErrorBoundary FallbackComponent={Fallback} onError={logError}>
            <Component />
            </ErrorBoundary>
          </ExtensionProvider>
        </PersistGate>
      </Provider>
    </>,
    root
  )
}

window.addEventListener('DOMContentLoaded', async () => {
  render(App)
})

// Allow hot module reload
if (module.hot) {
  module.hot.accept('./App.tsx', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const NextApp = require('./App.tsx').default
    render(NextApp)
  })
}
