# WICS Fall 2025 - Homepage App

This is the React-based frontend for the WICS Fall 2025 project.

## Prerequisites

- Node.js v18+ (for local development)  
- npm v9+ (comes with Node.js)  
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Docker development)  
- Git (to clone the repository)

---


## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.


## Run with Docker (recommended for development)
We found that some of our team members have difficulty with react and windows. We built a dockerfile to resolve this.
The following instructions are related to running the project through docker. Please have docker installed.

### Build the Docker image

Make sure you are in the project root (where `Dockerfile` is located):

```powershell
docker build -t homepage-app .
```
### Run the Contained with live reload
```powershell
docker run -it -p 3000:3000 `
  -v ${PWD}:/app `
  -v /app/node_modules `
  homepage-app
```

### View the project
Now, you should be able to view the project if you paste this to your local browser: [http://localhost:3000/]
