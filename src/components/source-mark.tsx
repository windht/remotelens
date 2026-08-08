import type { SourceKey } from '~/data/job-fixtures'

const SOURCE_MARKS: Record<SourceKey, { label: string; src: string }> = {
  jsguru: {
    label: 'JS Guru Jobs',
    src: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 18 18%22%3E%3Crect width=%2218%22 height=%2218%22 rx=%223%22 fill=%22%2325634D%22/%3E%3Cpath d=%22M5.5 4.5h2v6.2c0 1.8-1 2.8-2.8 2.8H4v-1.8h.5c.7 0 1-.3 1-1V4.5Zm3.2 6.3h1.9c.1.7.5 1 1.2 1 .6 0 1-.3 1-.8 0-.4-.3-.6-1.3-.9-1.8-.4-2.6-1.2-2.6-2.7 0-1.8 1.3-3 3.2-3 1.8 0 3 1 3.2 2.8h-1.9c-.1-.7-.5-1-1.2-1s-1.1.3-1.1.9c0 .5.4.7 1.5 1 1.7.4 2.5 1.2 2.5 2.6 0 1.8-1.3 3-3.4 3-1.8 0-3-1-3-2.9Z%22 fill=%22white%22/%3E%3C/svg%3E',
  },
  remote_ok: {
    label: 'Remote OK',
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAMKADAAQAAAABAAAAMAAAAADbN2wMAAAEwklEQVRoBe1YWSh9exRe5jGikDFKlAxFQsYHJaHIUJ4kUgoleTAU8mCKQjwoQ1EUeRAhuX9T4QklMj8YHwyZZ65vdY/u5ux/u/85597UXnVib2ut31rf9631O9GysrJ6px9s2j+4di5dbuD/ZlBmQGZARQRkCakIoMrhMgMqQ6hiApkBFQFUOVxmQGUIVUygq2I8h3t7e5OHhwdtb2/T0tISvb6+qiOtpBxqkVBMTAw1NTVRUlIS6eqqBRNJxcNJLQ1IPk0Djv8JXHp6emRiYkL6+vosr5ubG3p8fBS0A+YMDQ3p/f2d7u/v6e3tjf+OWAMDA9LS0uKYp6cnYZzg6Z8Hc3Nzen5+pru7Ow7E89XV1WdSZTFi77y8vCguLo48PT3JwsKCbm9vaW9vjyYnJ2lqaooeHh441MfHh9LS0vi5ubmZ9vf3uWHIMjw8nGtpb2+n1dVVwVHfJOTq6ko9PT1UVlZGpqamVFtbS0NDQxQfHy8IlPIQHR3NuXJzcykyMpL8/PwoLCyMC21sbKScnBxGF7ns7e0JsxQVFUVmZmac3tfXl0pLSykhIYHA2s7OzrdjvzXg7+9P2CouLi6UkZFBqamp5ObmRo6Ojt+Cf/cCOaqrq8nGxobW19cpOzubAgICKDk5mf769YuLzMvLo4iICKVpcF5rayuzNjIyQuXl5Sytr86CBqBDFAstIgEOg26hyePj46+xos/QLWRjbW1NJycnVFBQQIODgyyd6elpyvwAZnx8nM8pLCwkbW1BGcxGfX092dnZ0czMDBUXF4uuZkGksbExI4+BcXZ25uIxBy8vL0whKsYwBgYG8uFiHUB60LyOjg7Nzc3RysoKD6fCH3IAurgv4Ofk5KT4E+fNysqikJAQOjg4oMrKSgbh0+HLL4IGjIyMuGv4AJWxsTHa3NzkWYiNjaX09HSeB8gKTYoZmFToeHd3V+nwn56e0vX1NZ8DphSGQcecIMfi4iJfjthMYiZoANJRJMPWmZ+fp76+PkYS26CmpoYlhmECK2IGZMEcDMOpzNAgAINdXFwIXA4PD1m2WAKQMZoRM0ED0LulpSX7AiEg0NvbSw0NDbS1tcVrD/R2dnbymhVLilWp2BhBQUHk4ODwzTUlJYU30NHREc+GwgHNYAN2d3cz85gffE0RM0EDGD6wAJuYmKDz83NGAtskODiYcOjo6ChTL5YQ73FJIR4gYJuVlJQwc2AXzWD7ZGZmEi6llpYWAZu4F9B8RUUFz4+trS37YJspM0EDissLiYG8KjY7O0u4kG4+2EhMTKT+/n7q6uqigYEBKioq4uLxDh9lhlrgt7a2Ru7u7lRXV/cp73/763xslXLFCwRhE2HVDQ8PCzaHwkfZz9DQUIJU8E106uN2xQzgg+2zsLBAH/9AZhlgNeNW39jYoKqqKmpra6PLy0tOia2H7YbZw8V5dnbGswFJ4U7BLIGd5eVlwVLQUsd/p4FUfn4+dXR0sH6/fs9BhVi/aAQFoqjfbRZlIIm9Ex9vsYg/fI/BxkfdJpiBP00O6aE4zI66kJVai1okJPUwTfiphQFNFCY1p9yAVKQ05SczoClkpeaVGZCKlKb8ZAY0hazUvDIDUpHSlJ/MgKaQlZr3xzPwN1u29xuDPH2RAAAAAElFTkSuQmCC',
  },
  wwr: {
    label: 'We Work Remotely',
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0VXHyAAABRUlEQVQ4EdWST2qDQBTGv2jJH2IkokgRSTA9QC6QVU7RU2TbK+Q0BXeeoJtsCokomEXIMhowwfwRjdb3UkqhO7vKwJsZmPf93nxvpgGgrKL2EGorv4UPCnhuNmF1OmhUNp7ISq/Xw2g0wul0Qp7nUFUVWZZhv99DFEU+b7VaMAwD7nKJt3YbLxXg1XXvgH6/j9lsxqLL5QJZlhkURRGaVTUS00rgw+GAj/kcn7sdktvtDqDEoigwHo9Z6DgOC6bTKdI0xWq1wvF4hSRJeK/y4zjmd+BXoKpEpkqKomC73XJomoZut8tnlDOZTLDZbH7EROAe0Mb3fei6DrJDSYIgwPM8JEmC9XqNwWAA27YxHA7RqfwTkAY1kn8iNYgq0i2CIGBLlmWhLEuEYcj+z+czTNPEYrH4C2BcjelBf+Jvp/+28AWa0Yo5OSN3LAAAAABJRU5ErkJggg==',
  },
  remotejobs: {
    label: 'RemoteJobs.org',
    src: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 18 18%22%3E%3Crect width=%2218%22 height=%2218%22 rx=%223%22 fill=%22%234B5563%22/%3E%3Ctext x=%229%22 y=%2212.5%22 fill=%22white%22 font-size=%227%22 font-family=%22Arial,sans-serif%22 text-anchor=%22middle%22%3ER%3C/text%3E%3C/svg%3E',
  },
  remotive: {
    label: 'Remotive',
    src: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 18 18%22%3E%3Crect width=%2218%22 height=%2218%22 rx=%223%22 fill=%22%23D97706%22/%3E%3Ctext x=%229%22 y=%2212.5%22 fill=%22white%22 font-size=%227%22 font-family=%22Arial,sans-serif%22 text-anchor=%22middle%22%3ER%3C/text%3E%3C/svg%3E',
  },
  jobicy: {
    label: 'Jobicy',
    src: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 18 18%22%3E%3Crect width=%2218%22 height=%2218%22 rx=%223%22 fill=%22%237C3AED%22/%3E%3Ctext x=%229%22 y=%2212.5%22 fill=%22white%22 font-size=%227%22 font-family=%22Arial,sans-serif%22 text-anchor=%22middle%22%3EJ%3C/text%3E%3C/svg%3E',
  },
}

export function SourceMark({ provider }: { provider: SourceKey }) {
  const mark = SOURCE_MARKS[provider]
  return (
    <span className="source-logo" title={mark.label}>
      <img alt="" height="18" src={mark.src} width="18" />
      <span className="sr-only">{mark.label}</span>
    </span>
  )
}
