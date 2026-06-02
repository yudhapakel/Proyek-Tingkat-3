FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for Pillow/PyMySQL if any
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements-deploy.txt .

# Install dependencies without cache to keep image small
RUN pip install --no-cache-dir -r requirements-deploy.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
