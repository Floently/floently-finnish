FROM python:3.12-slim

WORKDIR /app

# Build 36 production candidates pass their exact clean Git commit SHA.
# A local/unverified build must never be mistaken for a qualified artifact.
ARG RELEASE_SOURCE_SHA=UNVERIFIED_LOCAL_BUILD
LABEL org.opencontainers.image.revision="${RELEASE_SOURCE_SHA}"

COPY apps/backend/requirements.txt ./requirements.txt
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r ./requirements.txt

COPY apps/backend/ .

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info --proxy-headers --forwarded-allow-ips='*'"]
