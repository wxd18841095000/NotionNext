import { useGlobal } from '@/lib/global'
import { useEffect } from 'react'

const STORAGE_KEY = 'notionnext-language'

const ENGLISH_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_ENGLISH === 'true'

const BASE_OPTIONS = [
  {
    lang: 'zh-CN',
    label: '简',
    title: '简体中文'
  },
  {
    lang: 'zh-TW',
    label: '繁',
    title: '繁體中文'
  }
]

const ENGLISH_OPTION = {
  lang: 'en-US',
  label: 'EN',
  title: 'English'
}

export default function LanguageSwitch() {
  const { lang, changeLang } = useGlobal()

  const options = ENGLISH_ENABLED
    ? [...BASE_OPTIONS, ENGLISH_OPTION]
    : BASE_OPTIONS

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      const allowed = options.some(option => option.lang === saved)

      if (allowed && saved !== lang) {
        changeLang(saved)
      } else if (saved === 'en-US' && !ENGLISH_ENABLED) {
        window.localStorage.setItem(STORAGE_KEY, 'zh-CN')
        changeLang('zh-CN')
      }
    } catch (error) {
      console.warn('[LanguageSwitch] localStorage unavailable', error)
    }
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang || 'zh-CN'
    }
  }, [lang])

  const switchLanguage = targetLang => {
    if (targetLang === lang) return

    try {
      window.localStorage.setItem(STORAGE_KEY, targetLang)
    } catch (error) {
      console.warn('[LanguageSwitch] localStorage unavailable', error)
    }

    changeLang(targetLang)
  }

  return (
    <div
      data-language-switch
      className='mx-1 h-8 flex shrink-0 items-center justify-center text-xs select-none'
      aria-label='Language switcher'>
      {options.map((option, index) => {
        const active = lang === option.lang

        return (
          <span key={option.lang} className='flex items-center'>
            {index > 0 && (
              <span aria-hidden='true' className='px-0.5 opacity-30'>
                |
              </span>
            )}

            <button
              type='button'
              title={option.title}
              aria-label={option.title}
              aria-pressed={active}
              onClick={() => switchLanguage(option.lang)}
              className={
                'px-1 py-1 rounded cursor-pointer transition-all ' +
                (active
                  ? 'font-bold text-indigo-600 dark:text-indigo-300'
                  : 'opacity-60 hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700')
              }>
              {option.label}
            </button>
          </span>
        )
      })}
    </div>
  )
}
