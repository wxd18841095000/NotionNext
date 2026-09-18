export default function ArticleDownloadButton({ post }) {
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

  const handlePrint = async () => {
    if (typeof window === 'undefined') return

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
