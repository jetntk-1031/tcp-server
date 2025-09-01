# Start from the official Node.js image on a lightweight Alpine Linux distribution.
# This keeps the final image size small.
FROM node:18-alpine

# Set the working directory inside the container.
# This is where your application code will live.
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files to the working directory.
# This step is done first to leverage Docker's layer caching.
# If your dependencies don't change, Docker won't re-run `npm install`.
COPY package*.json ./

# Install the project dependencies.
# In our case, this isn't strictly necessary since we have no dependencies,
# but it's a best practice for any real-world project.
RUN npm install

# Copy the rest of the application's source code into the container.
COPY . .

# Expose the port your application will run on.
# This is a documentation step, and doesn't actually publish the port.
# Railway will handle the port mapping for you.
EXPOSE 8080

# Define the command to run your application when the container starts.
# This should match the 'start' script in your package.json.
CMD [ "npm", "start" ]