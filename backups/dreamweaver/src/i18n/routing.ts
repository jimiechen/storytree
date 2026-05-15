import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['zh-CN', 'en-US'],
  defaultLocale: 'zh-CN'
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);