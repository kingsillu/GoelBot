# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy bot files
COPY . .

# Expose port 8000 for express server
EXPOSE 8000

# Start the bot
CMD ["node", "index.js"]
