const config = [
  // https://github.com/example/link-to-source-here
  // ['_vercel.sgcu.in.th', 'TXT', 'vc-domain-verify=wallet.7th.stupid.hackathon.in.th,ffacee0fe9da5f8feb3b'],

  // rpkm66
  ['api.freshmen2023.sgcu.in.th', 'CNAME', 'cname.deploys.app'],
  ['pbeta.freshmen2023.sgcu.in.th', 'CNAME', 'cname.deploys.app'],
  ['pdev.freshmen2023.sgcu.in.th', 'CNAME', 'cname.deploys.app'],
  ['sso-mock.freshmen2023.sgcu.in.th', 'CNAME', 'cname.deploys.app'],
  ['outline.sgcu.in.th', 'CNAME', 'cname.deploys.app'],
  ['db.isd.sgcu.in.th', 'CNAME', 'cname.deploys.app'],
  [
    '_cf-custom-hostname.api.freshmen2023.sgcu.in.th',
    'TXT',
    '12afedf9-ec5f-401d-a4fe-d2850d115a01',
  ],
  [
    '_cf-custom-hostname.pbeta.freshmen2023.sgcu.in.th',
    'TXT',
    '2cc0ed7f-7c83-443c-b941-cd1d2aeb285d',
  ],
  [
    '_cf-custom-hostname.sso-mock.freshmen2023.sgcu.in.th',
    'TXT',
    '36b970f5-e477-41d3-b185-9aff9f615ad1',
  ],
  [
    '_cf-custom-hostname.outline.sgcu.in.th',
    'TXT',
    '43c4fd10-d5a9-4b7c-83b8-984d637cdcd6',
  ],
  [
    '_cf-custom-hostname.db.isd.sgcu.in.th',
    'TXT',
    'fe2b0a4a-6061-4117-a50f-3fbdeeab7d80',
  ],
  [
    '_cf-custom-hostname.pdev.freshmen2023.sgcu.in.th',
    'TXT',
    '02fbe364-d090-47b6-a1ce-c107cb117700',
  ],
  [
    '_github-challenge-isd-sgcu-org.preview.freshmen2023.sgcu.in.th',
    'TXT',
    'cf2e5fffa7',
  ],

  // freshmen2023.sgcu.in.th
  ['freshmen2023.sgcu.in.th', 'CNAME', 'cname.vercel-dns.com'],
  ['preview.freshmen2023.sgcu.in.th', 'CNAME', 'cname.vercel-dns.com'],
]

const zoneId = process.env.CLOUDFLARE_ZONE_ID
const apiToken = process.env.CLOUDFLARE_API_TOKEN

await sync()

async function sync() {
  const zones = await getZones()
  const tasks = []
  for (const entry of config) {
    const [name, type, content] = entry
    const zone = zones.find((zone) => zone.name === name && zone.type === type)
    if (zone) {
      const id = zone.id
      if (!content) {
        tasks.push({
          name: `Delete: ${name} ${type} (id: ${id})`,
          run: () => deleteZoneById(id),
        })
      } else if (zone.content !== content) {
        tasks.push({
          name: `Update: ${name} ${type} -> ${content} (id: ${id})`,
          run: () => updateZoneById(id, type, name, content),
        })
      } else {
        tasks.push({
          name: `Up-to-date: ${name} ${type} -> ${content} (id: ${id})`,
        })
      }
    } else {
      tasks.push({
        name: `Create: ${name} ${type} -> ${content}`,
        run: () => createZone(type, name, content),
      })
    }
  }
  for (const task of tasks) {
    console.log(task.name)
    if (task.run && process.argv.includes('-f')) {
      console.log(await task.run())
    }
  }
}

async function getZones() {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  )
  const { result } = await response.json()
  return result
}

async function deleteZoneById(id) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  )
  return `${response.status}`
}

async function updateZoneById(id, type, name, content) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${id}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, name, content, ttl: 1 }),
    },
  )
  return `${response.status}`
}

async function createZone(type, name, content) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, name, content, ttl: 1 }),
    },
  )
  const { result } = await response.json()
  return `${response.status} ${result.id}`
}
