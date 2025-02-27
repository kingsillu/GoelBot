# Base image (Node.js 18)
FROM node:18

# Work directory set karo
WORKDIR /app

# Package files copy karo
COPY package.json package-lock.json ./

# Dependencies install karo
RUN npm install

# Baaki sabhi files copy karo
COPY . .

# Expose port (Agar web server bhi run ho raha hai)
EXPOSE 8000

# Bot start command
CMD ["node", "index.js"]
