# Use the official Node image with version 21.6
FROM node:lts AS runtime

# Set the working directory inside the container
WORKDIR /app

# Install Corepack globally
RUN npm install -g corepack

# Install PNPM using Corepack
RUN corepack prepare pnpm@latest --activate

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./


# Install dependencies using PNPM
RUN pnpm install

# Copy the rest of the application code to the container
COPY . .

# Build your Astro app
RUN npm run build

# Expose the port that your Astro app is running on
EXPOSE 3000

# Start your Astro app
CMD ["astro", "dev"]
