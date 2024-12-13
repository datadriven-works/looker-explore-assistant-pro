import React from 'react'
import { Marked, Tokens } from 'marked'

import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
// @ts-ignore
import hlsjLookML from 'highlightjs-lookml'
import 'highlight.js/styles/github.css'

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs border rounded shadow syntax-highlighter language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'markdown'
      return hljs.highlight(code, { language }).value
    },
  }),
)

// Custom renderer to add Tailwind CSS classes
const renderer = new marked.Renderer()

renderer.heading = ({ tokens, depth }) => {
  const tag = `h${depth}`
  let classes = 'font-bold text-gray-800'

  switch (depth) {
    case 1:
      classes += ' text-3xl'
      break
    case 2:
      classes += ' text-2xl'
      break
    case 3:
      classes += ' text-xl'
      break
    case 4:
      classes += ' text-lg'
      break
    case 5:
      classes += ' text-base'
      break
    case 6:
      classes += ' text-base'
      break
    default:
      classes += ' text-base'
      break
  }

  return `<${tag} class="${classes}">${renderer.parser.parseInline(tokens)}</${tag}>`
}

renderer.paragraph = ({ tokens }) => {
  return `<p class="mb-4">${renderer.parser.parseInline(tokens)}</p>`
}


renderer.list = (token: Tokens.List) => {
  const tag = token.ordered ? 'ol' : 'ul'
  const classes = 'list-inside mb-4 ' + (token.ordered ? 'list-decimal' : 'list-disc')
  const body = token.items.map((item: any) => renderer.listitem(item)).join('')
  return `<${tag} class="${classes}">${body}</${tag}>`
}

renderer.listitem = (token: Tokens.ListItem) => {
  return `<li class="mb-2">${renderer.parser.parseInline(token.tokens)}</li>`
}

const processText = (text: string) => {
  if (!text) {
    return text
  }
  const modifiedText = marked.parse(text, {
    renderer,
    gfm: true,
    breaks: true,
  })
  return modifiedText
}

const MarkdownText = ({ text }: { text: string }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: processText(text),
      }}
    />
  )
}

export default MarkdownText
