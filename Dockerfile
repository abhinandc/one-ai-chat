FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build
RUN node - <<'NODE'
const fs = require('fs');
const path = require('path');
const htmlPath = path.join('dist', 'index.html');
const cssPath = path.join('dist', 'assets', 'index.css');
let html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
html = html.replace(/<link rel="stylesheet"[^>]+>/, `<style>${css}</style>`);
fs.writeFileSync(htmlPath, html);
NODE

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]