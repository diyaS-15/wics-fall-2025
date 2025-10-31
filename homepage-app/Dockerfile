# Use official Node.js image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package manifest files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose port that create-react-app uses by default
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
