FROM node:26-bookworm

ARG WORKDIR=/workspaces/gaeldle
ENV WORKDIR=${WORKDIR}

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    make \
    g++ \
    procps \
    zoxide \
    jq \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# Set default shell to zsh for root
RUN chsh -s /bin/zsh root

# Install Codex
RUN CODEX_NON_INTERACTIVE=1 CODEX_INSTALL_DIR=/usr/local/bin \
    curl -fsSL https://chatgpt.com/codex/install.sh | bash

# Install Herdr CLI
RUN curl -fsSL https://herdr.dev/install.sh | HERDR_INSTALL_DIR=/usr/local/bin bash

# Install pnpm (matching package.json version), and @antfu/ni
RUN npm install -g pnpm@11 @antfu/ni

# Install Infisical CLI
RUN curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
    && apt-get update && apt-get install -y infisical

# Set Codex defaults.
RUN mkdir -p /root/.codex && cat > /root/.codex/config.toml << EOF
model = "gpt-5.6-terra"
model_reasoning_effort = "medium"

approval_policy = "never"
sandbox_mode = "danger-full-access"

cli_auth_credentials_store = "file"

[projects."${WORKDIR}"]
trust_level = "trusted"
EOF

# Configure prompt (with cwd) and initialize zoxide for bash and zsh
RUN echo 'PS1="\[\033[01;32m\]\u\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "' >> ~/.bashrc \
    && echo 'eval "$(zoxide init bash)"' >> ~/.bashrc \
    && echo 'autoload -Uz compinit && compinit' >> ~/.zshrc \
    && echo 'PROMPT="%F{green}%n%f:%F{blue}%~%f%# "' >> ~/.zshrc \
    && echo 'eval "$(zoxide init zsh)"' >> ~/.zshrc

WORKDIR ${WORKDIR}
