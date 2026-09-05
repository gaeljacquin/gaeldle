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
    jq \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# Set default shell to zsh for root
RUN chsh -s /bin/zsh root

# Install keyrings.alt for file-based keyring storage inside the container
RUN pip3 install --break-system-packages keyrings.alt

# Install Antigravity CLI
RUN curl -fsSL https://antigravity.google/cli/install.sh | bash

# Install Herdr CLI
RUN curl -fsSL https://herdr.dev/install.sh | HERDR_INSTALL_DIR=/usr/local/bin bash

# Install pnpm (matching package.json version), and @antfu/ni
RUN npm install -g pnpm@11 @antfu/ni

# Install Infisical CLI
RUN curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
    && apt-get update && apt-get install -y infisical

# Configure prompt (with cwd) and initialize zoxide for bash and zsh
RUN echo 'PS1="\[\033[01;32m\]\u\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "' >> ~/.bashrc \
    && echo 'eval "$(zoxide init bash)"' >> ~/.bashrc \
    && echo 'autoload -Uz compinit && compinit' >> ~/.zshrc \
    && echo 'PROMPT="%F{green}%n%f:%F{blue}%~%f%# "' >> ~/.zshrc \
    && echo 'eval "$(zoxide init zsh)"' >> ~/.zshrc

WORKDIR /workspaces/gaeldle
