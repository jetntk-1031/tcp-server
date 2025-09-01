# Use the official Node.js 20 LTS image as the base image.
# Using a specific version ensures a consistent build environment.
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory.
# This allows Docker to use caching to prevent re-installing dependencies
# when only the server code changes.
COPY package*.json ./

# Install application dependencies
RUN npm install --omit=dev

# Copy the server source code into the container
COPY . .

# Expose the port that the server will listen on
EXPOSE 3000

# Define the command to run the application
CMD [ "npm", "start" ]
