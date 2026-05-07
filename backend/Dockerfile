# --------Build stage--------------

FROM node:20-alpine AS builder

# Set working directory

WORKDIR /app

# Copy package files

COPY package*.json ./


# Install dependencies

RUN npm ci


# Copy source code

COPY . .

RUN npm run build

# --------Production stage---------

FROM node:20-alpine

# Create app directory

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Uploads directory for Excel files
RUN mkdir -p uploads

EXPOSE 4000

CMD ["node", "dist/server.js"]




