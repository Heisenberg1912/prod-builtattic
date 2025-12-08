# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=20.17.0

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY client/package.json client/package-lock.json ./client/
RUN npm --prefix client ci
COPY client ./client
RUN npm --prefix client run build

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/client/dist ./dist
RUN npm install -g serve
USER node

EXPOSE 8080
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
