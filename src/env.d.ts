// Библиотека не зависит от Node, но использует договорённость process.env.NODE_ENV:
// сборщик приложения подставляет значение на этапе сборки.
declare const process: { env: { NODE_ENV?: string } }
