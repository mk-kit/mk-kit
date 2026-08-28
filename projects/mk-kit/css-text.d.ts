/**
 * Lets a spec read a stylesheet as text through the builder's import
 * attribute loader: `import css from './x.css' with { loader: 'text' }`.
 */
declare module '*.css' {
  const text: string;
  export default text;
}
