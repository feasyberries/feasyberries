FROM node:20-bookworm

# Install pnpm
#RUN curl -fsSL https://get.pnpm.io/install.sh | sh -; node - add --global pnpm
RUN corepack enable; corepack prepare pnpm@latest --activate
