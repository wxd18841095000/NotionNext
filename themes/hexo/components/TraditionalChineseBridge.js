import { useGlobal } from '@/lib/global'
import OpenCC from 'opencc-js'
import { useEffect } from 'react'

const toTraditional = OpenCC.Converter({
  from: 'cn',
  to: 'tw'
})

const toSimplified = OpenCC.Converter({
  from: 'tw',
  to: 'cn'
})

const originalText = new WeakMap()

const IGNORE_SELECTOR = [
  '[data-language-switch]',
  'script',
  'style',
  'noscript',
  'code',
  'pre',
  'textarea',
  'input',
  'select',
  'option',
  'svg',
  '.katex',
  '.katex-display'
].join(',')

function shouldIgnore(node) {
  const parent = node?.parentElement
  if (!parent) return true
  return Boolean(parent.closest(IGNORE_SELECTOR))
}

function containsChinese(text) {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(text || '')
}

function getConverter(lang) {
  if (lang === 'zh-TW') return toTraditional
  if (lang === 'zh-CN') return toSimplified
  return null
}

function convertTextNode(node, targetLang) {
  if (!node || shouldIgnore(node)) return

  const current = node.nodeValue || ''
  if (!containsChinese(current)) return

  const converter = getConverter(targetLang)
  if (!converter) return

  if (originalText.has(node)) {
    const original = originalText.get(node)

    const expectedSimplified = toSimplified(original)
    const expectedTraditional = toTraditional(original)

    // React / Next.js may reuse the same text node but replace
    // its actual source content. Only replace our saved source
    // when the new value is not simply one of its converted forms.
    if (
      current !== original &&
      current !== expectedSimplified &&
      current !== expectedTraditional
    ) {
      originalText.set(node, current)
    }
  } else {
    // Preserve whatever Notion/React originally rendered.
    // It may be Simplified OR Traditional Chinese.
    originalText.set(node, current)
  }

  const source = originalText.get(node) || current
  const converted = converter(source)

  if (node.nodeValue !== converted) {
    node.nodeValue = converted
  }
}

function walkTextNodes(root, callback) {
  if (!root || typeof document === 'undefined') return

  if (root.nodeType === Node.TEXT_NODE) {
    callback(root)
    return
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  )

  let node = walker.nextNode()

  while (node) {
    callback(node)
    node = walker.nextNode()
  }
}

function convertTree(root, targetLang) {
  walkTextNodes(root, node => {
    convertTextNode(node, targetLang)
  })
}

function restoreTextNode(node) {
  if (!node || !originalText.has(node)) return

  const source = originalText.get(node)

  if (typeof source === 'string' && node.nodeValue !== source) {
    node.nodeValue = source
  }

  originalText.delete(node)
}

function restoreTree(root) {
  walkTextNodes(root, restoreTextNode)
}

function getThemeRoot() {
  if (typeof document === 'undefined') return null
  return document.getElementById('theme-hexo')
}

function isChineseMode(lang) {
  return lang === 'zh-CN' || lang === 'zh-TW'
}

export default function TraditionalChineseBridge() {
  const { lang } = useGlobal()

  useEffect(() => {
    if (typeof document === 'undefined') return

    let disposed = false
    let rafId = null
    const timers = []

    const applyCurrentLanguage = () => {
      if (disposed) return

      const root = getThemeRoot()
      if (!root) return

      if (isChineseMode(lang)) {
        convertTree(root, lang)
      } else {
        restoreTree(root)
      }
    }

    const scheduleApply = () => {
      if (disposed || rafId !== null) return

      rafId = window.requestAnimationFrame(() => {
        rafId = null
        applyCurrentLanguage()
      })
    }

    // Normal language switching.
    applyCurrentLanguage()

    // English is reserved for the future AI translation layer.
    if (!isChineseMode(lang)) {
      return () => {
        disposed = true

        if (rafId !== null) {
          window.cancelAnimationFrame(rafId)
        }
      }
    }

    // Observe the whole page so this remains active even when
    // Next.js hydration replaces #theme-hexo or parts of the page.
    const observerTarget =
      document.body || document.documentElement

    const observer = new MutationObserver(mutations => {
      const root = getThemeRoot()

      if (!root) {
        scheduleApply()
        return
      }

      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          if (root.contains(mutation.target)) {
            convertTextNode(mutation.target, lang)
          }

          continue
        }

        for (const addedNode of mutation.addedNodes) {
          if (addedNode.nodeType === Node.TEXT_NODE) {
            if (root.contains(addedNode)) {
              convertTextNode(addedNode, lang)
            }

            continue
          }

          if (addedNode.nodeType !== Node.ELEMENT_NODE) {
            continue
          }

          if (addedNode === root || root.contains(addedNode)) {
            convertTree(addedNode, lang)
            continue
          }

          if (
            typeof addedNode.contains === 'function' &&
            addedNode.contains(root)
          ) {
            scheduleApply()
          }
        }
      }
    })

    observer.observe(observerTarget, {
      subtree: true,
      childList: true,
      characterData: true
    })

    // Re-apply after hydration and delayed page updates.
    const retryDelays = [
      0,
      50,
      150,
      300,
      600,
      1200,
      2500,
      5000
    ]

    for (const delay of retryDelays) {
      timers.push(
        window.setTimeout(scheduleApply, delay)
      )
    }

    const handlePageShow = () => {
      scheduleApply()
    }

    window.addEventListener('pageshow', handlePageShow)

    return () => {
      disposed = true
      observer.disconnect()
      window.removeEventListener('pageshow', handlePageShow)

      for (const timer of timers) {
        window.clearTimeout(timer)
      }

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [lang])

  return null
}
