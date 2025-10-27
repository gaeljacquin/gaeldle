import { Elysia } from 'elysia';

export const homeRoutes = new Elysia()
  .get("/", () => "Hello World!")
;
