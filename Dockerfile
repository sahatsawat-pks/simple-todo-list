# Use Node.js 18 Alpine as base image (lightweight)
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files to the container
COPY . .

# Expose port 3000 (Node.js app port)
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
