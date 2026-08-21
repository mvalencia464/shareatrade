import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);
  const { pathname } = url;
  if (pathname.length > 1 && !pathname.endsWith("/") && !pathname.includes(".")) {
    url.pathname = `${pathname}/`;
    return context.redirect(`${url.pathname}${url.search}`, 301);
  }
  return next();
});
