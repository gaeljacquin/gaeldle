FROM node:20-alpine

ARG user=toor
ARG uid=1001
ARG group=www-data
ARG workdir=/usr/src/app

RUN adduser -G $group -u $uid -h /home/$user $user -D && adduser $user root

USER root

WORKDIR $workdir

RUN chown -R $user:$group $workdir

COPY package.json pnpm-lock.yaml ./

RUN if ! which pnpm > /dev/null 2>&1; then \
        npm install -g pnpm; \
        echo 'pnpm installed'; \
      else \
        echo 'pnpm is already installed'; \
    fi

USER $user

COPY --chown=$user:www-data . .

RUN if ! pnpm list prisma >/dev/null 2>&1; then \
        pnpm add prisma && pnpm prisma generate; \
    else \
        echo "Prisma is already installed"; \
    fi

RUN pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "dev"]
