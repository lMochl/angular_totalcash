FROM node:18-alpine as build
WORKDIR /app/src
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM nginx:1.23
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
COPY --from=build /app/src/dist/frontend/browser /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]