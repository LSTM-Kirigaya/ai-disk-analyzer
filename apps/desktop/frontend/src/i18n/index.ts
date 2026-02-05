import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh.json'
import en from './locales/en.json'
import ja from './locales/ja.json'

const resources = {
  zh: { translation: zh },
  en: { translation: en },
  ja: { translation: ja },
}

// 检测系统语言
const detectLanguage = (): string => {
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('zh')) return 'zh'
  if (browserLang.startsWith('ja')) return 'ja'
  return 'en'
}

// 从 localStorage 获取保存的语言设置
const getSavedLanguage = (): string | null => {
  try {
    return localStorage.getItem('app-language')
  } catch {
    return null
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: getSavedLanguage() || detectLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

// 保存语言设置到 localStorage
export const setLanguage = (lang: string) => {
  i18n.changeLanguage(lang)
  try {
    localStorage.setItem('app-language', lang)
  } catch {
    // ignore storage errors
  }
}

export const supportedLanguages = [
  { code: 'zh', name: '简体中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
]

export default i18n
