FROM node:22-alpine AS frontend
WORKDIR /build
COPY package.json package-lock.json vite.config.ts ./
COPY frontend ./frontend
RUN npm ci && npm run build

FROM rust:1.88-slim-bookworm AS backend
ARG BUILD_SHA=dev
ENV BUILD_SHA=${BUILD_SHA}
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim AS runtime
RUN useradd --system --uid 10001 --create-home relay
RUN mkdir /data && chown relay:relay /data
WORKDIR /app
COPY --from=backend /build/target/release/family-doodle-relay /usr/local/bin/family-doodle-relay
COPY --from=frontend /build/dist ./dist
USER relay
ENV PORT=8080
EXPOSE 8080
CMD ["/usr/local/bin/family-doodle-relay"]
