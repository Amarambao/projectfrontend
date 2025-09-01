# Этап сборки
FROM node:23.4.0 AS builder

# Рабочая директория
WORKDIR /app

# Копируем package*.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install
RUN npm install -g vite

# Копируем остальные файлы проекта
COPY . .

# Аргумент для выбора окружения
ARG ENV_FILE=.env
ARG BUILD_MODE=production

# Для production
#docker build --build-arg ENV_FILE=.env.production --build-arg BUILD_MODE=production -t my-app .
# Для development
#docker build --build-arg ENV_FILE=.env.development --build-arg BUILD_MODE=development -t my-app .

# Устанавливаем переменную окружения на основе аргумента
ENV VITE_ENV_FILE=${ENV_FILE}

# Выполняем команду сборки
RUN vite build --mode ${BUILD_MODE}

RUN ls -la /app
RUN ls -la /app/dist

# Этап деплоя
FROM nginx:alpine

# Копируем собранные файлы в папку статического контента Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# По желанию: если нужно переопределить конфиг nginx, то раскомментировать:
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Экспонируем порт
EXPOSE 8080

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]