# Multi-stage build for Node.js and Python dependencies
FROM node:18-slim AS base

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy Python requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies (including dev dependencies for building)
RUN npm ci

# Copy application code
COPY . .

# Create scripts directory and make Python script executable
RUN chmod +x scripts/kerykeion_calculator.py

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PYTHON_PATH="/opt/venv/bin/python3"

# Start the application
CMD ["npm", "start"]