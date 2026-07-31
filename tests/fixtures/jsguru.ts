function card(input: {
  company?: string
  description?: string
  employment?: string
  id: string
  location?: string
  mode?: string
  salary?: string
  tags?: string[]
  title?: string
}) {
  return `<div class="p-6">
    <div>
      <h3><a href="https://jsgurujobs.com/jobs/${input.id}">${input.title ?? ''}</a></h3>
      <p class="mt-1 text-sm text-gray-500">${input.company ?? ''}</p>
      <div class="mt-2 flex items-center text-sm text-gray-500">
        <span>${input.location ?? ''}</span>
        <span>${input.employment ?? ''}</span>
        <span>${input.salary ?? ''}</span>
      </div>
      <div class="mt-2 flex items-center gap-1.5">
        <span>${input.mode ?? ''}</span>
      </div>
    </div>
    <div class="mt-4 flex flex-wrap gap-2 ml-16">
      ${(input.tags ?? []).map((tag) => `<span>${tag}</span>`).join('')}
    </div>
    <div class="mt-4 text-sm text-gray-600 ml-16">
      ${input.description ?? ''}
    </div>
  </div>`
}

export const JSGURU_PAGE_FIXTURES = [
  `<html><body>
    ${card({
      company: 'Kumo Systems',
      description:
        'Build safe services. <script>alert(1)</script><img src=x onerror=bad()>',
      employment: 'Full-time',
      id: '551',
      location: 'Global, Remote',
      mode: '🌍 Remote',
      salary: '$160,000 - $210,000 per year',
      tags: ['Rust', 'TypeScript'],
      title: 'Senior Backend Engineer',
    })}
    ${card({ company: '', id: '550', title: '' })}
  </body></html>`,
  `<html><body>
    ${card({
      company: 'Kumo Systems',
      description: 'Repeated pagination edge.',
      employment: 'Full-time',
      id: '551',
      location: 'Global, Remote',
      mode: '🌍 Worldwide',
      tags: ['Distributed Systems'],
      title: 'Senior Backend Engineer',
    })}
    ${card({
      company: 'Northstar Labs',
      description: 'Build accessible interfaces.',
      employment: 'Contract',
      id: '549',
      location: 'Europe',
      mode: '🌍 Remote',
      tags: ['React', 'TypeScript'],
      title: 'Frontend Developer',
    })}
  </body></html>`,
  '<html><body><p>No more jobs on this fixture page.</p></body></html>',
] as const
