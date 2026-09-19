export default function ArticlePrintStyle() {
  return (
    <style jsx global>{`
      #article-print-root {
        position: fixed;
        left: -100000px;
        top: 0;
        width: 794px;
        visibility: hidden;
        pointer-events: none;
        background: white;
        color: #111;
      }

      @media print {
        @page {
          size: A4;
          margin: 16mm 14mm 18mm;
        }

        html,
        body {
          background: #fff !important;
          color: #111 !important;
        }

        body.article-printing {
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body.article-printing #theme-hexo {
          background: #fff !important;
          color: #111 !important;
          min-height: 0 !important;
        }

        body.article-printing
          #theme-hexo
          > *:not(#article-print-root) {
          display: none !important;
        }

        body.article-printing #article-print-root {
          display: block !important;
          position: static !important;
          left: auto !important;
          top: auto !important;
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          visibility: visible !important;
          pointer-events: auto !important;
          overflow: visible !important;
          background: #fff !important;
          color: #111 !important;
        }

        #article-print-root .article-print-document-title {
          margin: 0 0 5mm !important;
          padding: 0 !important;
          color: #111 !important;
          font-size: 24pt !important;
          line-height: 1.35 !important;
          font-weight: 700 !important;
          text-align: center !important;
          text-shadow: none !important;
          break-after: avoid-page;
          page-break-after: avoid;
        }

        #article-print-root .article-print-document-meta {
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
          text-shadow: none !important;
        }

        #article-print-root .article-print-document-meta * {
          color: #666 !important;
          background: transparent !important;
          text-shadow: none !important;
          box-shadow: none !important;
        }

        #article-print-root .article-print-document-body,
        #article-print-root .notion,
        #article-print-root .notion-page,
        #article-print-root .notion-page-content {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        #article-print-root .article-print-document-body {
          color: #111 !important;
          background: #fff !important;
          overflow: visible !important;
        }

        /*
         * iOS Safari / WKWebView long-document print safety.
         * Remove inherited clipping / height / transform constraints while printing.
         */
        body.article-printing,
        body.article-printing #theme-hexo,
        body.article-printing #article-print-root,
        #article-print-root .article-print-document-body,
        #article-print-root .notion,
        #article-print-root .notion-page,
        #article-print-root .notion-page-content {
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          overflow: visible !important;
          overflow-x: visible !important;
          overflow-y: visible !important;
          transform: none !important;
          contain: none !important;
          clip: auto !important;
        }

        #article-print-root .article-print-document-body *,
        #article-print-root .notion-page-content * {
          max-height: none !important;
        }

        #article-print-root img {
          max-width: 100% !important;
          max-height: 240mm !important;
          width: auto !important;
          height: auto !important;
          object-fit: contain !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        /* iOS/WebKit：长内容必须允许跨页，否则可能截断文章尾部 */
        #article-print-root figure,
        #article-print-root table,
        #article-print-root pre,
        #article-print-root blockquote {
          break-inside: auto !important;
          page-break-inside: auto !important;
        }

        /* 表格整体可以分页，但尽量不要把单独一行劈开 */
        #article-print-root tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        #article-print-root h1,
        #article-print-root h2,
        #article-print-root h3,
        #article-print-root h4 {
          break-after: avoid-page;
          page-break-after: avoid;
        }

        #article-print-root pre,
        #article-print-root code {
          white-space: pre-wrap !important;
          overflow-wrap: anywhere !important;
        }

        #article-print-root table {
          max-width: 100% !important;
        }

        #article-print-root a {
          color: #111 !important;
          text-decoration: none !important;
        }

        #article-print-root .article-print-document-source {
          margin-top: 12mm !important;
          padding-top: 4mm !important;
          border-top: 1px solid #ddd !important;
          color: #777 !important;
          font-size: 8.5pt !important;
          line-height: 1.5 !important;
          overflow-wrap: anywhere !important;
        }
      }
    `}</style>
  )
}
