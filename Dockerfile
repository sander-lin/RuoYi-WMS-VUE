FROM node:16.20.0-alpine as base
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

RUN sed -i "s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g" /etc/apk/repositories
ENV TZ="Asia/Shanghai"
RUN apk update && \
    apk add tzdata && \
    apk add --no-cache make jq python3 py3-pip g++
RUN echo "Asia/shanghai" > /etc/timezone
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN npm install pnpm -g
#RUN pnpm config set store-dir ~/.pnpm-store

WORKDIR /app
COPY ./package.json ./package.json
RUN pnpm install

WORKDIR /app
COPY . .
RUN pnpm build

FROM nginx:stable-alpine as production-stage
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=base /app/nginx/nginx.conf /etc/nginx/conf.d
#COPY --from=base /app/src/assets /usr/share/nginx/html/src/assets
COPY --from=base /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
