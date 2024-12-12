// For CSS modules
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

// For SCSS modules - assuming you are using SCSS syntax for these files
declare module '*.module.scss' {
  const classes: Record<string, string>
  export default classes
}

// For regular CSS files, if you are importing them directly and want type support
declare module '*.css' {
  const css: Record<string, string>
  export default css
}

// For regular SCSS files, similar to CSS but for SCSS
declare module '*.scss' {
  const scss: Record<string, string>
  export default scss
}

declare module '*.md' {
  const content: string;
  export default content;
}
