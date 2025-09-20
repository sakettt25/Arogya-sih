# Multi-stage Dockerfile for GramAarogya Multilingual Chatbot
# Optimized for production deployment with both Flask backend and Next.js frontend

# =============================================================================
# Stage 1: Python Backend Builder
# =============================================================================
FROM python:3.11-slim as backend-builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libc6-dev \
    libffi-dev \
    libssl-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# =============================================================================
# Stage 2: Node.js Frontend Builder
# =============================================================================
FROM node:18-alpine as frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Copy frontend source code
COPY . .

# Build the application
RUN pnpm run build

# =============================================================================
# Stage 3: Rasa NLP Server
# =============================================================================
FROM rasa/rasa:3.6.0 as rasa-builder

# Set working directory
WORKDIR /app

# Copy Rasa project files
COPY ./chatbot/domain.yml ./chatbot/config.yml ./
COPY ./chatbot/data/ ./data/
COPY ./chatbot/actions/ ./actions/

# Train the model
RUN rasa train --domain domain.yml --config config.yml --data data/

# =============================================================================
# Stage 4: Production Runtime
# =============================================================================
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production
ENV NODE_ENV=production

# Install system dependencies for production
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd --create-home --shell /bin/bash app

# Set working directory
WORKDIR /app

# Copy Python dependencies from builder
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=backend-builder /usr/local/bin/ /usr/local/bin/

# Copy built frontend from builder
COPY --from=frontend-builder /app/.next /app/.next
COPY --from=frontend-builder /app/public /app/public
COPY --from=frontend-builder /app/package.json /app/
COPY --from=frontend-builder /app/node_modules /app/node_modules

# Copy Rasa model
COPY --from=rasa-builder /app/models /app/models

# Copy application source code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/backups /var/log/supervisor

# Set up nginx configuration
COPY docker/nginx.conf /etc/nginx/sites-available/default

# Set up supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create startup script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Change ownership to app user
RUN chown -R app:app /app

# Switch to app user
USER app

# Expose ports
EXPOSE 3000 5000 5005 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start services
ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]