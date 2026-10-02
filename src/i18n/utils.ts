import es from './es.json';
import en from './en.json';

export type Language = 'es' | 'en';

const dictionaries = {
  es,
  en
};

export function getI18n(lang: Language = 'es') {
  return dictionaries[lang] || dictionaries.es;
}
