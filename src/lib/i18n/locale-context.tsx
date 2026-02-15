"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { messages, type Locale } from "./messages";

const COOKIE_NAME = "jihe_locale";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function getLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return "zh";
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  const v = match?.[2];
  if (v === "zh" || v === "en" || v === "ja") return v;
  return "zh";
}

function setLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const defaultValue: LocaleContextValue = {
  locale: "zh",
  setLocale: () => {},
  t: (k) => k,
};

const LocaleContext = createContext<LocaleContextValue>(defaultValue);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getLocaleFromCookie());
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setLocaleCookie(next);
    // 暂不调用 router.refresh()，避免整页无法加载；切换语言后手动刷新页面可更新首页/日志等多语言正文
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = messages[locale];
      return dict[key] ?? messages.zh[key] ?? key;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  if (!mounted) {
    return (
      <LocaleContext.Provider value={{ ...defaultValue, t: (k) => messages.zh[k] ?? k }}>
        {children}
      </LocaleContext.Provider>
    );
  }

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
