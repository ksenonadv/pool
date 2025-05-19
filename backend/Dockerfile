# Stage 1: Build the NestJS application
FROM node:20-alpine AS build

WORKDIR /app

COPY ./backend ./backend
COPY ./shared ./shared

WORKDIR /app/backend

RUN npm install
RUN npm run build

# Stage 2: Serve the application with Node.js
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=build /app/backend/package*.json ./
COPY --from=build /app/backend/dist ./dist

RUN npm install --only=production

EXPOSE 3000

CMD ["node", "dist/main"]