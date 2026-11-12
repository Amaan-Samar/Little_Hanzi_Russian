// composables/useSettings.js
import { ref, watch } from 'vue'

const STORAGE_KEY = 'littleRussian_settings'
const LEGACY_KEYS = ['littleKorean_settings', 'littleChinese_settings']

const RUSSIAN_FONTS = ['Inter', 'NotoSans', 'PTSerif', 'NotoSerif', 'Roboto', 'Poppins', 'Georgia']

function readSavedSettings() {
  const keys = [STORAGE_KEY, ...LEGACY_KEYS]
  for (const key of keys) {
    try {
      const saved = localStorage.getItem(key)
      if (saved) return JSON.parse(saved)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }
  return null
}

export function useSettings() {
  const loadSettings = () => {
    const parsed = readSavedSettings()
    if (!parsed) return null

    const displayOrder =
      parsed.displayOrder === 'en-kr' ||
      parsed.displayOrder === 'en-cn' ||
      parsed.displayOrder === 'en-ru'
        ? 'en-ru'
        : parsed.displayOrder === 'kr-en' ||
            parsed.displayOrder === 'cn-en' ||
            parsed.displayOrder === 'ru-en'
          ? 'ru-en'
          : 'ru-en'

    const fontSize = parsed.fontSize ?? 18

    return {
      fontSize,
      selectedFont: RUSSIAN_FONTS.includes(parsed.selectedFont) ? parsed.selectedFont : 'Inter',
      showRomanization: parsed.showRomanization ?? parsed.showPinyin ?? true,
      showRussian: parsed.showRussian ?? parsed.showKorean ?? parsed.showChinese ?? true,
      showEnglish: parsed.showEnglish ?? true,
      displayOrder,
      interleaveLines: parsed.interleaveLines ?? false,
      romanizationFontSize: Math.min(parsed.romanizationFontSize ?? 12, fontSize),
      englishFontSize: Math.min(parsed.englishFontSize ?? 14, fontSize),
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName.slice(0, 40) : '',
    }
  }

  const saveSettings = (settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const defaultSettings = {
    fontSize: 18,
    selectedFont: 'Inter',
    showRomanization: true,
    showRussian: true,
    showEnglish: true,
    displayOrder: 'ru-en',
    interleaveLines: false,
    romanizationFontSize: 12,
    englishFontSize: 14,
    displayName: '',
  }

  const savedSettings = loadSettings()

  const fontSize = ref(savedSettings?.fontSize ?? defaultSettings.fontSize)
  const selectedFont = ref(savedSettings?.selectedFont ?? defaultSettings.selectedFont)
  const showRomanization = ref(savedSettings?.showRomanization ?? defaultSettings.showRomanization)
  const showRussian = ref(savedSettings?.showRussian ?? defaultSettings.showRussian)
  const showEnglish = ref(savedSettings?.showEnglish ?? defaultSettings.showEnglish)
  const displayOrder = ref(savedSettings?.displayOrder ?? defaultSettings.displayOrder)
  const interleaveLines = ref(savedSettings?.interleaveLines ?? defaultSettings.interleaveLines)
  const romanizationFontSize = ref(
    savedSettings?.romanizationFontSize ?? defaultSettings.romanizationFontSize,
  )
  const englishFontSize = ref(savedSettings?.englishFontSize ?? defaultSettings.englishFontSize)
  const displayName = ref(savedSettings?.displayName ?? defaultSettings.displayName)

  const saveCurrentSettings = () => {
    saveSettings({
      fontSize: fontSize.value,
      selectedFont: selectedFont.value,
      showRomanization: showRomanization.value,
      showRussian: showRussian.value,
      showEnglish: showEnglish.value,
      displayOrder: displayOrder.value,
      interleaveLines: interleaveLines.value,
      romanizationFontSize: romanizationFontSize.value,
      englishFontSize: englishFontSize.value,
      displayName: displayName.value,
    })
  }

  watch(
    [
      fontSize,
      selectedFont,
      showRomanization,
      showRussian,
      showEnglish,
      displayOrder,
      interleaveLines,
      romanizationFontSize,
      englishFontSize,
      displayName,
    ],
    () => {
      saveCurrentSettings()
    },
    { deep: true },
  )

  const resetSettings = () => {
    fontSize.value = defaultSettings.fontSize
    selectedFont.value = defaultSettings.selectedFont
    showRomanization.value = defaultSettings.showRomanization
    showRussian.value = defaultSettings.showRussian
    showEnglish.value = defaultSettings.showEnglish
    displayOrder.value = defaultSettings.displayOrder
    interleaveLines.value = defaultSettings.interleaveLines
    romanizationFontSize.value = defaultSettings.romanizationFontSize
    englishFontSize.value = defaultSettings.englishFontSize
    displayName.value = defaultSettings.displayName
  }

  return {
    fontSize,
    selectedFont,
    showRomanization,
    showRussian,
    showEnglish,
    displayOrder,
    interleaveLines,
    romanizationFontSize,
    englishFontSize,
    displayName,
    resetSettings,
    saveCurrentSettings,
  }
}
