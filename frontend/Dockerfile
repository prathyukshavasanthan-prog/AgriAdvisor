FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY vite.config.ts ./
COPY index.html ./
COPY src/ ./src/

ARG VITE_API_URL=http://localhost:5900
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5273

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 5273

CMD ["npm", "run", "serve"]
