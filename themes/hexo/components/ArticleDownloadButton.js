export default function ArticleDownloadButton({ post }) {
  const isWeChatBrowser = () => {
    if (typeof navigator === 'undefined') return false
    return /MicroMessenger/i.test(navigator.userAgent || '')
  }

  const copyCurrentUrl = async () => {
    const url = window.location.href

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        return true
      }
    } catch (error) {
      console.warn('[Article PDF] clipboard API unavailable', error)
    }

    try {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()

      const copied = document.execCommand('copy')
      textarea.remove()

      return copied
    } catch (error) {
      console.warn('[Article PDF] fallback copy failed', error)
      return false
    }
  }

  const showWeChatPdfGuide = () => {
    const staleGuide = document.getElementById('wechat-pdf-guide')

    if (staleGuide) {
      staleGuide.remove()
    }

    const overlay = document.createElement('div')
    overlay.id = 'wechat-pdf-guide'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', '微信下载 PDF 提示')

    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'background:rgba(0,0,0,.55)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:24px'
    ].join(';')

    const panel = document.createElement('div')

    panel.style.cssText = [
      'width:min(420px,100%)',
      'background:#fff',
      'color:#111827',
      'border-radius:14px',
      'padding:22px',
      'box-shadow:0 20px 50px rgba(0,0,0,.28)',
      'font-size:15px',
      'line-height:1.7'
    ].join(';')

    const title = document.createElement('div')
    title.textContent = '微信内暂不支持直接下载 PDF'
    title.style.cssText =
      'font-size:18px;font-weight:700;margin-bottom:12px;'

    const message = document.createElement('div')
    message.innerHTML =
      '请点击微信右上角 <strong>···</strong><br>' +
      '选择 <strong>“在浏览器打开”</strong><br>' +
      '然后再次点击 <strong>“下载 PDF”</strong>。'

    const buttons = document.createElement('div')
    buttons.style.cssText =
      'display:flex;gap:10px;justify-content:flex-end;margin-top:20px;flex-wrap:wrap;'

    const closeButton = document.createElement('button')
    closeButton.type = 'button'
    closeButton.textContent = '知道了'
    closeButton.style.cssText =
      'border:1px solid #d1d5db;background:#fff;color:#374151;border-radius:8px;padding:9px 14px;cursor:pointer;'

    const copyButton = document.createElement('button')
    copyButton.type = 'button'
    copyButton.textContent = '复制当前链接'
    copyButton.style.cssText =
      'border:0;background:#4f46e5;color:#fff;border-radius:8px;padding:9px 14px;cursor:pointer;'

    const close = () => {
      overlay.remove()
    }

    closeButton.addEventListener('click', close)

    copyButton.addEventListener('click', async () => {
      const copied = await copyCurrentUrl()

      copyButton.textContent = copied
        ? '已复制链接'
        : '复制失败，请手动复制'

      if (copied) {
        window.setTimeout(close, 900)
      }
    })

    overlay.addEventListener('click', event => {
      if (event.target === overlay) {
        close()
      }
    })

    buttons.appendChild(closeButton)
    buttons.appendChild(copyButton)

    panel.appendChild(title)
    panel.appendChild(message)
    panel.appendChild(buttons)

    overlay.appendChild(panel)
    document.body.appendChild(overlay)
  }

  const waitForImages = root => {
    const images = Array.from(root.querySelectorAll('img'))

    return Promise.all(
      images.map(img => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve()
        }

        return new Promise(resolve => {
          let settled = false

          const done = () => {
            if (settled) return
            settled = true
            window.clearTimeout(timer)
            resolve()
          }

          const timer = window.setTimeout(done, 3000)

          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
        })
      })
    )
  }

  const isIOSBrowser = () => {
    if (typeof navigator === 'undefined') return false

    const ua = navigator.userAgent || ''

    return (
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    )
  }

  const printInIsolatedIOSWindow = async () => {
    /*
     * iOS Safari 对超长、复杂主文档的 window.print() 容易截断尾部。
     * 必须在用户点击事件中立即打开新窗口，避免 Safari 弹窗拦截。
     */
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      window.alert('无法打开打印页面，请允许浏览器弹出窗口后重试。')
      return
    }

    const sourceArticle = document.querySelector(
      '#article-wrapper #notion-article'
    )

    if (!sourceArticle) {
      printWindow.close()
      window.print()
      return
    }

    const visibleTitle =
      document.getElementById('article-print-title')?.textContent?.trim() ||
      post?.title ||
      document.title

    const sourceMeta = document.getElementById('article-print-meta')
    const sourceImages = Array.from(sourceArticle.querySelectorAll('img'))

    const printDocument = printWindow.document

    printDocument.open()
    printDocument.write(
      '<!doctype html>' +
        '<html lang="zh-CN">' +
        '<head>' +
        '<meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title></title>' +
        '</head>' +
        '<body>' +
        '<main id="ios-article-print-root"></main>' +
        '</body>' +
        '</html>'
    )
    printDocument.close()

    printDocument.title = visibleTitle

    /*
     * 复制当前页面已经加载的 CSS。
     * 独立窗口没有 Header / Sidebar / 页面父容器，
     * 因此只让 Notion 正文继续获得原来的排版能力。
     */
    const sourceStyleNodes = Array.from(
      document.querySelectorAll(
        'head link[rel="stylesheet"], head style'
      )
    )

    sourceStyleNodes.forEach(node => {
      try {
        printDocument.head.appendChild(
          printDocument.importNode(node, true)
        )
      } catch (error) {
        console.warn('[Article PDF] style copy failed', error)
      }
    })

    const isolatedStyle = printDocument.createElement('style')

    isolatedStyle.textContent = `
      @page {
        size: A4;
        margin: 16mm 14mm 18mm;
      }

      html,
      body {
        width: auto !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        background: #fff !important;
        color: #111 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      #ios-article-print-root {
        display: block !important;
        position: static !important;
        width: 100% !important;
        max-width: none !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        transform: none !important;
        contain: none !important;
        background: #fff !important;
        color: #111 !important;
      }

      #ios-article-print-root .ios-print-title {
        margin: 0 0 5mm !important;
        padding: 0 !important;
        color: #111 !important;
        font-size: 24pt !important;
        line-height: 1.35 !important;
        font-weight: 700 !important;
        text-align: center !important;
        text-shadow: none !important;
      }

      #ios-article-print-root .ios-print-meta {
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        gap: 2mm 4mm !important;
        margin: 0 0 10mm !important;
        padding: 0 0 5mm !important;
        border-bottom: 1px solid #ddd !important;
        color: #666 !important;
        font-size: 9.5pt !important;
        line-height: 1.5 !important;
      }

      #ios-article-print-root .ios-print-meta * {
        color: #666 !important;
        background: transparent !important;
        text-shadow: none !important;
        box-shadow: none !important;
      }

      #ios-article-print-root .ios-print-body,
      #ios-article-print-root .notion,
      #ios-article-print-root .notion-page,
      #ios-article-print-root .notion-page-content {
        display: block !important;
        position: static !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        overflow: visible !important;
        overflow-x: visible !important;
        overflow-y: visible !important;
        transform: none !important;
        contain: none !important;
        clip: auto !important;
      }

      #ios-article-print-root .ios-print-body *,
      #ios-article-print-root .notion-page-content * {
        max-height: none !important;
      }

      #ios-article-print-root img {
        max-width: 100% !important;
        max-height: 240mm !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      #ios-article-print-root figure,
      #ios-article-print-root table,
      #ios-article-print-root pre,
      #ios-article-print-root blockquote {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }

      #ios-article-print-root pre,
      #ios-article-print-root code {
        white-space: pre-wrap !important;
        overflow-wrap: anywhere !important;
      }

      #ios-article-print-root table {
        width: 100% !important;
        max-width: 100% !important;
      }

      #ios-article-print-root a {
        color: #111 !important;
        text-decoration: none !important;
      }

      #ios-article-print-root .ios-print-source {
        margin-top: 12mm !important;
        padding-top: 4mm !important;
        border-top: 1px solid #ddd !important;
        color: #777 !important;
        font-size: 8.5pt !important;
        line-height: 1.5 !important;
        overflow-wrap: anywhere !important;
      }

      @media print {
        html,
        body,
        #ios-article-print-root {
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          overflow: visible !important;
        }
      }
    `

    printDocument.head.appendChild(isolatedStyle)

    const root = printDocument.getElementById(
      'ios-article-print-root'
    )

    const title = printDocument.createElement('h1')
    title.className = 'ios-print-title'
    title.textContent = visibleTitle
    root.appendChild(title)

    if (sourceMeta) {
      const meta = printDocument.importNode(sourceMeta, true)
      meta.removeAttribute('id')
      meta.className = 'ios-print-meta'
      root.appendChild(meta)
    }

    const article = printDocument.importNode(sourceArticle, true)
    article.id = 'notion-article-print'
    article.classList.add('ios-print-body')

    const clonedImages = Array.from(
      article.querySelectorAll('img')
    )

    clonedImages.forEach((img, index) => {
      const sourceImage = sourceImages[index]

      const src =
        sourceImage?.currentSrc ||
        sourceImage?.src ||
        img.currentSrc ||
        img.src ||
        img.dataset?.src

      if (src) {
        img.src = src
      }

      img.loading = 'eager'
    })

    root.appendChild(article)

    const source = printDocument.createElement('div')
    source.className = 'ios-print-source'
    source.textContent = `URL: ${window.location.href}`
    root.appendChild(source)

    const waitForStyles = () => {
      const links = Array.from(
        printDocument.querySelectorAll('link[rel="stylesheet"]')
      )

      return Promise.all(
        links.map(link => {
          if (link.sheet) return Promise.resolve()

          return new Promise(resolve => {
            let settled = false

            const done = () => {
              if (settled) return
              settled = true
              printWindow.clearTimeout(timer)
              resolve()
            }

            const timer = printWindow.setTimeout(done, 5000)

            link.addEventListener('load', done, { once: true })
            link.addEventListener('error', done, { once: true })
          })
        })
      )
    }

    const waitForIOSImages = () => {
      const images = Array.from(root.querySelectorAll('img'))

      return Promise.all(
        images.map(img => {
          if (img.complete && img.naturalWidth > 0) {
            return Promise.resolve()
          }

          return new Promise(resolve => {
            let settled = false

            const done = () => {
              if (settled) return
              settled = true
              printWindow.clearTimeout(timer)
              resolve()
            }

            const timer = printWindow.setTimeout(done, 12000)

            img.addEventListener('load', done, { once: true })
            img.addEventListener('error', done, { once: true })
          })
        })
      )
    }

    try {
      await waitForStyles()

      try {
        if (printDocument.fonts?.ready) {
          await printDocument.fonts.ready
        }
      } catch (error) {
        console.warn('[Article PDF] iOS font wait failed', error)
      }

      await waitForIOSImages()

      await new Promise(resolve => {
        printWindow.requestAnimationFrame(() => {
          printWindow.requestAnimationFrame(resolve)
        })
      })

      await new Promise(resolve => {
        printWindow.setTimeout(resolve, 350)
      })

      printWindow.focus()
      printWindow.print()
    } catch (error) {
      console.error('[Article PDF] isolated iOS print failed', error)
    }
  }

  const handlePrint = async () => {
    if (typeof window === 'undefined') return

    if (isWeChatBrowser()) {
      showWeChatPdfGuide()
      return
    }

    if (isIOSBrowser()) {
      await printInIsolatedIOSWindow()
      return
    }


    const themeRoot = document.getElementById('theme-hexo')
    const sourceArticle = document.querySelector(
      '#article-wrapper #notion-article'
    )

    if (!themeRoot || !sourceArticle) {
      window.print()
      return
    }

    const staleRoot = document.getElementById('article-print-root')
    if (staleRoot) {
      staleRoot.remove()
    }

    document.body.classList.remove('article-printing')

    const printRoot = document.createElement('div')
    printRoot.id = 'article-print-root'

    // 使用当前页面已经完成简/繁转换后的标题
    const visibleTitle =
      document.getElementById('article-print-title')?.textContent?.trim() ||
      post?.title ||
      document.title

    const title = document.createElement('h1')
    title.className = 'article-print-document-title'
    title.textContent = visibleTitle
    printRoot.appendChild(title)

    // 使用当前页面已经完成简/繁转换后的发布日期等信息
    const sourceMeta = document.getElementById('article-print-meta')
    if (sourceMeta) {
      const meta = sourceMeta.cloneNode(true)
      meta.removeAttribute('id')
      meta.className = 'article-print-document-meta'
      printRoot.appendChild(meta)
    }

    // 只复制真正的 Notion 正文
    const article = sourceArticle.cloneNode(true)
    article.id = 'notion-article-print'
    article.classList.add('article-print-document-body')

    // 强制打印副本中的图片积极加载
    const sourceImages = Array.from(sourceArticle.querySelectorAll('img'))
    const clonedImages = Array.from(article.querySelectorAll('img'))

    clonedImages.forEach((img, index) => {
      const sourceImage = sourceImages[index]
      const src =
        sourceImage?.currentSrc ||
        sourceImage?.src ||
        img.currentSrc ||
        img.src ||
        img.dataset?.src

      if (src) {
        img.src = src
      }

      img.loading = 'eager'
    })

    printRoot.appendChild(article)

    // PDF 最后保留来源网址
    const source = document.createElement('div')
    source.className = 'article-print-document-source'
    source.textContent = `URL: ${window.location.href}`
    printRoot.appendChild(source)

    // 放进 Hexo 根节点，继续继承现有文章 CSS
    themeRoot.appendChild(printRoot)

    const previousTitle = document.title
    document.title = visibleTitle
    document.body.classList.add('article-printing')

    let cleaned = false

    const cleanup = () => {
      if (cleaned) return
      cleaned = true

      document.body.classList.remove('article-printing')

      if (printRoot.isConnected) {
        printRoot.remove()
      }

      document.title = previousTitle
      window.removeEventListener('afterprint', cleanup)
    }

    window.addEventListener('afterprint', cleanup)

    try {
      await waitForImages(printRoot)

      await new Promise(resolve => {
        window.requestAnimationFrame(() => resolve())
      })

      window.print()
    } catch (error) {
      console.error('[Article PDF] print failed', error)
      cleanup()
    }
  }

  return (
    <div className='article-download-actions flex justify-end px-5 pt-3 pb-1'>
      <button
        type='button'
        onClick={handlePrint}
        aria-label='下载 PDF'
        title='在打印窗口选择“保存为 PDF”'
        className='inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-hexo-black-gray hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-150'>
        <span aria-hidden='true'>⇩</span>
        <span>下载 PDF</span>
      </button>
    </div>
  )
}
