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
