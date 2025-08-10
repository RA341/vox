FROM node:22-alpine AS web

WORKDIR /ui

COPY ui/package.json ui/package-lock.json ./

RUN npm i

COPY ui/ .

RUN npm run build

FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /vox

COPY pyproject.toml uv.lock* ./

RUN uv sync --frozen

COPY src src

EXPOSE 8000

COPY --from=web /ui/dist/ ui/

CMD ["uv", "run", "-m", "src.main"]
