// 死链扫描器：遍历 docs/ 下所有 .md，检查站内链接是否都能解析到真实页面
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve('docs')
const mdFiles = []

function walk(d) {
  for (const f of fs.readdirSync(d)) {
    if (f === 'node_modules' || f === '.vitepress' || f === 'plans' || f === 'public') continue
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (f.endsWith('.md')) mdFiles.push(p)
  }
}
walk(ROOT)

// 有效页面集合（cleanUrls 下无 .md / index 变目录）
const pages = new Set()
for (const f of mdFiles) {
  const rel = f.slice(ROOT.length + 1).replace(/\\/g, '/').replace(/\.md$/, '')
  pages.add('/' + rel)
  if (rel.endsWith('index')) pages.add('/' + rel.replace(/index$/, ''))
}

let dead = 0
const linkRe = /\]\(([^)]+)\)/g
for (const f of mdFiles) {
  const content = fs.readFileSync(f, 'utf8')
  const rel = f.slice(ROOT.length + 1).replace(/\\/g, '/')
  let m
  while ((m = linkRe.exec(content))) {
    let link = m[1]
    link = link.split('#')[0].split('?')[0].trim()
    if (!link || /^(https?:|mailto:|tel:|#)/.test(link)) continue
    // 绝对链接直接用；相对链接基于当前文件目录解析
    const base = '/' + rel.replace(/\.md$/, '')
    const resolved = link.startsWith('/')
      ? path.posix.normalize(link)
      : path.posix.normalize(path.posix.join(path.posix.dirname(base), link))
    let target = resolved.endsWith('/') ? resolved + 'index' : resolved
    // cleanUrls：/foo/index 也可写 /foo，已由 pages 处理
    if (!pages.has(target) && !pages.has(target.replace(/\/index$/, ''))) target = target.replace(/\/index$/, '')
    // cleanUrls：目录/foo → /foo
    if (!pages.has(target) && !pages.has(target.replace(/\/index$/, ''))) {
      console.log(`DEAD  ${rel}  ->  ${m[1]}`)
      dead++
    }
  }
}
console.log(`\n扫描 ${mdFiles.length} 个文件，死链 ${dead} 个`)

// 导航可达性：每个内容页必须能从 config.ts 的 nav 或 sidebar 到达
// 防止目录结构漂移 → 新页面建了却忘了接入导航
// 注意：link: '...' 分散在各 const xxxSidebar 数组与 nav 里，sidebar: 块内只有路径映射 key，
// 因此从整个 config.ts 提取（nav + sidebar 合起来才是完整的可达性来源）
const configText = fs.readFileSync(path.resolve('docs/.vitepress/config.ts'), 'utf8')
// 统一规范化：去尾斜杠、去 /index 后缀，使 '/foo/' 与 '/foo/index' 等价
const canon = (s) => s.replace(/\/+$/, '').replace(/\/index$/, '')
const linkRe2 = /link:\s*'([^']+)'/g
const navLinks = new Set()
let mm
while ((mm = linkRe2.exec(configText))) navLinks.add(canon(mm[1]))

let unlinked = 0
for (const f of mdFiles) {
  const rel = f.slice(ROOT.length + 1).replace(/\\/g, '/').replace(/\.md$/, '')
  const canonical = canon('/' + rel)
  if (!navLinks.has(canonical)) {
    console.log(`UNLINKED  ${rel}  （未接入 config.ts 导航/侧边栏）`)
    unlinked++
  }
}
console.log(`导航可达性：${mdFiles.length} 个内容页，${unlinked} 个未接入`)


