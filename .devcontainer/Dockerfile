FROM node:26-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    python3-pip \
    make \
    g++ \
    procps \
    zoxide \
    && rm -rf /var/lib/apt/lists/*

# Install keyrings.alt for file-based keyring storage inside the container
RUN pip3 install --break-system-packages keyrings.alt

# Install Antigravity CLI
RUN curl -fsSL https://antigravity.google/cli/install.sh | bash

# Install pnpm (matching package.json version), and @antfu/ni
RUN npm install -g pnpm@11 @antfu/ni

# Install Infisical CLI
RUN curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
    && apt-get update && apt-get install -y infisical

# Initialize zoxide for bash
RUN echo 'eval "$(zoxide init bash)"' >> ~/.bashrc

WORKDIR /workspaces/gaeldle
