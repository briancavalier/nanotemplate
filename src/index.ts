import escape from 'escape-html'

export class Renderable<R extends readonly unknown[]> {
  constructor(public readonly strings: readonly string[], public readonly values: R) { }
}

export type Template<R extends readonly unknown[]> = (...r: R) => Renderable<R>

export const t = <R extends readonly unknown[]>(strings: readonly string[], ...values: R): Renderable<R> =>
  new Renderable(strings, values)

// Mark a string as containing potentially unsafe content.
export const unsafe = <A>(value: A): Unsafe<A> => new Unsafe(value)

export class Unsafe<A> {
  constructor(public readonly value: A) { }
}

// Values supported by render
export type Content = number | boolean | string | Unsafe<string> | Renderable<readonly Content[]> | Iterable<Content>

// Render a Renderable to an HTML string
// This function will include UnsafeStrings verbatim, *without
// HTML escaping*.  That's necessary in some cases, such as including
// dynamic JSON or JavaScript.
export function renderToString<A extends readonly Content[]>({ strings, values }: Renderable<A>): string {
  if (values.length === 0) return strings.join('')

  let s = ''
  let i = 0
  for (; i < values.length; i++) s += strings[i] + stringify(values[i])
  return s + strings[i]
}

export const stringify = (c: Content): string =>
  typeof c === 'string' ? escape(c)
    : c instanceof Unsafe ? c.value
      : c instanceof Renderable ? renderToString(c)
        : typeof (c as Iterable<Content>)[Symbol.iterator] === 'function' ? stringifyIterable(c as Iterable<Content>)
          : `${c}`

function stringifyIterable(i: Iterable<Content>): string {
  let s = ''
  for (const c of i) s += stringify(c)
  return s
}
