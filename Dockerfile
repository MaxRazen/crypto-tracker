# --- Frontend ---
FROM node:22-alpine as frontend
USER node
WORKDIR /home/node/web
COPY --chown=node:node web/ ./
RUN yarn install --frozen-lockfile
ENV VITE_API_URL /
ENV NODE_ENV production
RUN yarn build

# --- Backend ---

FROM node:22-alpine as backend
RUN apk add --no-cache python3 make g++ gcc
WORKDIR /home/node
COPY --chown=node:node package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY --chown=node:node . .
RUN yarn build
RUN yarn install --production --frozen-lockfile --ignore-scripts

# --- Runtime ---

FROM node:22-alpine
ENV NODE_ENV production
USER 1000
WORKDIR /home/node
COPY --from=backend /home/node/package*.json /home/node/
COPY --from=backend /home/node/node_modules/ /home/node/node_modules/
COPY --from=backend /home/node/dist/ /home/node/dist/
COPY --from=backend /home/node/yarn.lock /home/node/yarn.lock
COPY --from=frontend /home/node/web/dist/ /home/node/web/dist/

EXPOSE 3000

CMD ["node", "dist/main.js"]
