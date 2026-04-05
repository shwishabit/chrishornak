import fs from 'fs'

// Content bbox: x:490.8 y:161.3 w:1342.8 h:188.9
// Dot above text starts ~y:140, text bottom ~y:350
// Add generous left margin, balance top/bottom around text center (~y:255)
const vb = '330 120 1520 280'

for (const [src, dst] of [
  ['../brand/Canva SVGs/White Text Logo.svg', 'public/images/wordmark-dark.svg'],
  ['../brand/Canva SVGs/Black Text Logo.svg', 'public/images/wordmark-light.svg'],
]) {
  let svg = fs.readFileSync(src, 'utf-8')
  svg = svg.replace(/<metadata>[\s\S]*?<\/metadata>/g, '')
  svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`)
  svg = svg.replace(/width="[^"]*"/, 'width="800"')
  svg = svg.replace(/height="[^"]*"/, '')
  fs.writeFileSync(dst, svg)
  console.log('Wrote ' + dst)
}
