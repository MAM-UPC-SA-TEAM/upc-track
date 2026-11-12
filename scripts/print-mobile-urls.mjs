import os from 'node:os'

function isPrivateIPv4(ip) {
  if (!ip) return false
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('192.168.')) return true

  // 172.16.0.0 - 172.31.255.255
  if (ip.startsWith('172.')) {
    const parts = ip.split('.')
    const secondOctet = Number(parts[1])
    return secondOctet >= 16 && secondOctet <= 31
  }

  return false
}

function getCandidateIPv4s() {
  const interfaces = os.networkInterfaces()
  const candidates = []

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses) continue

    for (const addr of addresses) {
      if (addr.family !== 'IPv4' || addr.internal) continue
      candidates.push({ name, ip: addr.address })
    }
  }

  return candidates
}

function pickBestIP(candidates) {
  const privateIPs = candidates.filter((item) => isPrivateIPv4(item.ip))

  if (privateIPs.length > 0) {
    // Heuristic: prefer Wi-Fi adapters when available.
    const wifi = privateIPs.find((item) => /wi-?fi|wlan|wireless/i.test(item.name))
    return wifi ?? privateIPs[0]
  }

  return candidates[0]
}

const frontendPort = process.env.FRONTEND_PORT || '5173'
const backendPort = process.env.BACKEND_PORT || '3000'

const candidates = getCandidateIPv4s()
const best = pickBestIP(candidates)

console.log('')
console.log('=== Mobile Access URLs ===')

if (!best) {
  console.log('No se detecto una IPv4 privada automaticamente.')
  console.log('Conecta el PC a la red del celular y prueba nuevamente.')
  console.log('')
  process.exit(0)
}

console.log(`Adaptador: ${best.name}`)
console.log(`IP local:  ${best.ip}`)
console.log(`Frontend:  http://${best.ip}:${frontendPort}`)
console.log(`Backend:   http://${best.ip}:${backendPort}/api/health`)
console.log('')
console.log('Si Vite detecta 5173 ocupado, cambiara a 5174/5175 automaticamente.')
console.log('')
