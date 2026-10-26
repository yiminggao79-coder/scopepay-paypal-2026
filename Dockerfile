FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node . .
RUN npm ci --omit=dev --ignore-scripts --no-fund
RUN mkdir -p /app/data && chown node:node /app/data
ENV HOST=0.0.0.0 PORT=4313
EXPOSE 4313
USER node
CMD ["node","server.mjs"]
