const config = [
  // https://github.com/example/link-to-source-here
  // ['_vercel.sgcu.in.th', 'TXT', 'vc-domain-verify=wallet.7th.stupid.hackathon.in.th,ffacee0fe9da5f8feb3b'],

  // isd infrastructure
  ['grafana.isd.sgcu.in.th', 'A', '157.230.44.126'],
  ['grafana.isd.sgcu.in.th', 'AAAA', '2400:6180:0:d0::1103:d001'],
  ['uptime.isd.sgcu.in.th', 'A', '157.230.44.126'],
  ['uptime.isd.sgcu.in.th', 'AAAA', '2400:6180:0:d0::1103:d001'],
  ['argo.isd.sgcu.in.th', 'A', '157.230.44.126'],
  ['argo.isd.sgcu.in.th', 'AAAA', '2400:6180:0:d0::1103:d001'],
  ['traefik.isd.sgcu.in.th', 'A', '157.230.44.126'],
  ['traefik.isd.sgcu.in.th', 'AAAA', '2400:6180:0:d0::1103:d001'],
  ['internal.isd.sgcu.in.th', 'A', '157.230.44.126'],
  ['internal.isd.sgcu.in.th', 'AAAA', '2400:6180:0:d0::1103:d001'],
  ['minio-console.isd.sgcu.in.th', 'A', '157.230.44.126'],
  ['minio-console.isd.sgcu.in.th', 'AAAA', '2400:6180:0:d0::1103:d001'],

  // oph66
  ['preview-api.oph66.sgcu.in.th', 'A', '157.230.44.126'],
  ['preview-api.oph66.sgcu.in.th', 'AAAA', '2400:6180:0:d0::1103:d001'],
  ['preview.oph66.sgcu.in.th', 'A', '157.230.44.126'],
  ['preview.oph66.sgcu.in.th', 'AAAA', '2400:6180:0:d0::1103:d001'],
  ['cuopenhouse.sgcu.in.th', 'A', '157.230.44.126'],
  ['cuopenhouse.sgcu.in.th', 'AAAA', '2400:6180:0:d0::1103:d001'],
  ['api.cuopenhouse.sgcu.in.th', 'A', '157.230.44.126'],
  ['api.cuopenhouse.sgcu.in.th', 'AAAA', '2400:6180:0:d0::1103:d001'],

  // rpkm66
  ['isd.sgcu.in.th', 'CNAME', 'isd-sgcu.github.io'],

  // github
  ['sgcu.in.th', 'A', '185.199.108.153'],
  ['sgcu.in.th', 'A', '185.199.109.153'],
  ['sgcu.in.th', 'A', '185.199.110.153'],
  ['sgcu.in.th', 'A', '185.199.111.153'],
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
