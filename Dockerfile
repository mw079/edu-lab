# Edu Lab on a host (Render, see render.yaml): the teacher app at / (with the demo video) and the server that
# makes lessons, with Chromium for the lesson checks. Build from the repository root: docker build -t edu-lab .
FROM node:22-bookworm-slim
WORKDIR /srv/edu-lab
# Chromium in a shared folder, so the server can run as the unprivileged "node" user (lesson pages are model-made).
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Packages and Chromium (with the system libraries it needs) first, so code changes do not reinstall them.
COPY edu-lab/package.json edu-lab/package-lock.json ./
RUN npm ci && npx playwright install --with-deps chromium && rm -rf /var/lib/apt/lists/* /root/.npm

COPY edu-lab ./
COPY docs ../docs
RUN npm run build && mkdir -p data && chown node:node data

# The API key, password and daily limit come from the host's settings, never from the image.
ENV NODE_ENV=production HOST=0.0.0.0 PORT=10000
EXPOSE 10000
USER node
CMD ["node_modules/.bin/tsx", "server/index.ts"]
