# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app

COPY ./frontend ./frontend
COPY ./shared ./shared

WORKDIR /app/frontend

RUN npm install
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

WORKDIR /app

# Copy the build output to replace the default nginx contents
COPY --from=build /app/frontend/dist/frontend/browser /usr/share/nginx/html

# Copy custom nginx config
COPY --from=build /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]