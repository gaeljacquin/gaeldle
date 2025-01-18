FROM node:latest AS base

ARG workdir=/app

WORKDIR $workdir

COPY package.json pnpm-lock.yaml* ./

COPY . .

RUN npm install -g corepack pnpm
RUN corepack enable pnpm && pnpm install
RUN npx prisma db pull
RUN npx prisma generate

EXPOSE 3000

CMD ["pnpm", "dev"]
