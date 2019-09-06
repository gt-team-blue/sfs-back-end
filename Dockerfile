# Create image from nodejs base image
FROM node:11

# Clone the repo from github
RUN rm -rf sfs-back-end
RUN git clone https://github.com/gt-team-blue/sfs-back-end.git
COPY .env sfs-back-end/

# Change working directory to the cloned repo
WORKDIR /sfs-back-end

# Install all the dependencies
RUN npm install

# Expose port
EXPOSE 5000

# Run the application
CMD ["npm", "start"]
