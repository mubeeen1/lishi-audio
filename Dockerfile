# Use the official Node.js image as a base
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Install PM2 globally
RUN npm install -g pm2

# Expose the port (if your app listens on a specific port)
EXPOSE 3000

# Command to run your bot using PM2
CMD ["pm2-runtime", "start", "index.js", "--name", "whatsapp-bot"]
