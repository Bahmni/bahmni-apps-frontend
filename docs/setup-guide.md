# Bahmni Clinical Frontend Setup Guide

This guide provides comprehensive instructions for setting up the Bahmni Clinical Frontend application for both development and production environments.

## Introduction

Bahmni Clinical Frontend is a React TypeScript application for the Bahmni Clinical module, built with Webpack and Carbon Design System. It includes Progressive Web App (PWA) support for offline capabilities.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v22.x or later recommended)

  - [Download Node.js](https://nodejs.org/en/download/)
  - Verify installation: `node --version`

- **Yarn** (v1.22.x or later recommended)

  - [Installation instructions](https://yarnpkg.com/getting-started/install)
  - Verify installation: `yarn --version`

- **Docker** and **Docker Compose**

  - [Install Docker](https://docs.docker.com/get-docker/)
  - [Install Docker Compose](https://docs.docker.com/compose/install/)
  - Verify installation: `docker --version` and `docker compose --version`

- **Git**
  - [Install Git](https://git-scm.com/downloads)
  - Verify installation: `git --version`

### GitHub Personal Access Token (PAT)

You'll need a GitHub Personal Access Token to access the GitHub Container Registry:

1. Go to your GitHub account settings: [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click "Generate new token" (classic)
3. Give your token a descriptive name
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `read:packages` (Download packages from GitHub Package Registry)
5. Click "Generate token"
6. **Important**: Copy and save your token immediately as it won't be shown again

## Environment Setup

### 1. Clone Required Repositories

```bash
# Clone the Bahmni Docker repository
git clone git@github.com:bahnew/bahmni-docker.git
# If you want to clone using the web URL
# Clone Bahmni-docker from Bahnew repository(https://github.com/bahnew/bahmni-docker)
# git clone https://github.com/bahnew/bahmni-docker.git
cd bahmni-docker

# Clone the Bahmni Clinical Frontend repository (in a separate terminal)
# Clone from Bahnew(https://github.com/bahnew/bahmni-clinical-frontend/tree/main)
git clone https://github.com/bahnew/bahmni-clinical-frontend.git
```

### 2. Authenticate with GitHub Container Registry

```bash
export GITHUB_PAT=<your-token-here>
# Login to GitHub Container Registry using your Personal Access Token
echo $GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Replace `GITHUB_PAT` with your GitHub Personal Access Token and `YOUR_GITHUB_USERNAME` with your GitHub username.

### 3. Bring Up EMR Components

After setting up the repositories and authenticating with GitHub Container Registry, you need to start the EMR components:

```bash
# Navigate to the bahmni-docker/bahmni-standard directory
cd bahmni-docker/bahmni-standard

# Start all EMR components with the latest images
docker compose --env-file .env.dev up -d
```

This command will pull the latest images for all EMR components and start them in detached mode. You can verify that the containers are running with:

```bash
docker ps
```

Wait for all services to start up completely. Open your browser and navigate to the Bahmni EMR URL and open any Active patient (typically start from <http://localhost/bahmni/home>). After login, register a patient and start a visit. Now navigate to the clinical module, and go to New - Active queue. You will see the new dashboard being rendered. 

## Development Setup Options

There are two methods for local development. Choose the one that best fits your workflow:

### Method 1: Mounting the Built Artifact (Docker-based)

This method allows you to build the application locally and mount it into the Docker container:

1. **Update Environment Variables**:

   In the `bahmni-docker` directory, edit the `.env.dev` file to point to your local bahmni-clinical-frontend repository:

   ```bash
   # Open the .env.dev file
   nano .env.dev

   # Update the BAHMNI_CLINICAL_FRONTEND_PATH variable
   BAHMNI_CLINICAL_FRONTEND_PATH=/path/to/your/bahmni-clinical-frontend
   ```

2. **Uncomment Volumes in Docker Compose**:

   Edit the Docker Compose file to uncomment the volumes section for the clinical-frontend service.

3. **Build the Application**:

   In your bahmni-clinical-frontend directory:

   ```bash
   # Install dependencies
   yarn

   # Build the application
   yarn build
   ```

4. **Start the Docker Services**:

   In the bahmni-docker/bahmni-standard directory:

   ```bash
   # Start all EMR components with the latest images
   docker compose --env-file .env.dev up -d

   # Or, to update only the clinical-frontend service
   docker compose --env-file .env.dev up -d clinical-frontend
   ```

5. **Access the Application**:

   Open your browser and navigate to the Bahmni EMR URL and open any Active patient (typically start from <http://localhost/bahmni/home>).

6. **Development Workflow**:

   With this setup, every time you rebuild the application, the changes will be automatically available in the browser without restarting the Docker container.

### Method 2: Using Hot Reload (Local Development Server)

This method provides a faster development experience with hot reloading:

1. **Start the Development Server**:

   In your bahmni-clinical-frontend directory:

   ```bash
   # Install dependencies (if not already done)
   yarn

   # Start the development server
   yarn start
   ```

   This will start the development server and automatically open your browser at [http://localhost:3000](http://localhost:3000).

2. **Set Up Authentication**:

   To authorize API requests to the backend:

   a. Login to Bahmni EMR in another browser tab (typically <https://localhost/bahmni/home>)

   b. After successful login, open browser developer tools (F12 or right-click > Inspect)

   c. Go to the Application tab > Cookies

   d. Find and copy the value of the `JSESSIONID` cookie

   e. In your localhost:3000 tab, use developer tools to create a new cookie:

   - Name: `JSESSIONID`
   - Value: (paste the copied value)

3. **Development Workflow**:

   With this setup, any changes you make to the source code will be immediately reflected in the browser.

## Additional Commands

### Building for Production

```bash
# Build the application for production
yarn build
```

The build artifacts will be stored in the `dist/` directory.

### Linting and Formatting

```bash
# Run ESLint to check for code quality issues
yarn lint

# Fix ESLint issues automatically
yarn lint:fix

# Check formatting with Prettier
yarn prettier:check

# Fix formatting issues with Prettier
yarn prettier:fix
```

## Code Quality Tools

The project includes several tools to maintain code quality and consistency across the codebase.

### Husky Pre-commit Hooks

Husky is used to set up Git hooks that run automatically at specific points in the Git workflow. The project uses a pre-commit hook to ensure code quality before commits are made.

#### Setup

Husky is automatically installed and configured when you run `yarn install` through the `prepare` script in package.json.

The pre-commit hook is configured to run lint-staged, which runs linters and formatters on staged files.

#### Lint-staged Configuration

Lint-staged is configured in package.json to run ESLint and Prettier on staged TypeScript files.

This ensures that all TypeScript files are properly linted and formatted before they are committed to the repository.

### ESLint Configuration

ESLint is configured using the new flat config format in the `eslint.config.ts` file.

This configuration:

- Applies to all JavaScript and TypeScript files
- Uses the recommended configurations for JavaScript, TypeScript, and React
- Sets up React version detection
- Configures specific rules for React prop types

### Prettier Configuration

Prettier is configured in the `.prettierrc.json` file.

This configuration ensures consistent code formatting across the project, with rules for:

- Using 2 spaces for indentation
- Maximum line width of 80 characters
- Trailing commas in multi-line structures
- Semicolons at the end of statements
- Spaces around brackets in object literals
- Parentheses around arrow function parameters

### Testing

```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test:watch
```

### Storybook

Storybook provides an isolated environment for developing and showcasing UI components. It's a great tool for component-driven development and visual testing.

```bash
# Start Storybook development server
yarn storybook

# Build Storybook as a static web application
yarn build-storybook
```

The Storybook development server will run on [http://localhost:6006](http://localhost:6006) by default.

## Troubleshooting

### Common Issues

1. **Authentication Failures with GitHub Container Registry**:

   - Ensure your Personal Access Token has the correct scopes
   - Check that your token hasn't expired
   - Verify you're using the correct username

2. **Docker Compose Errors**:

   - Ensure all required environment variables are set in `.env.dev`
   - Check for port conflicts with other running services

3. **API Authorization Issues**:
   - Verify the JSESSIONID cookie is correctly set
   - Ensure the Bahmni backend services are running

### Getting Help

If you encounter issues not covered in this guide:

- Check the [GitHub repository issues](https://github.com/bahnew/bahmni-clinical-frontend/issues)
- Consult the [Bahmni community forums](https://talk.openmrs.org/c/software/bahmni/35)

## Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Carbon Design System](https://carbondesignsystem.com/)
- [Webpack Documentation](https://webpack.js.org/concepts/)
- [Docker Documentation](https://docs.docker.com/)
- [Bahmni Documentation](https://bahmni.atlassian.net/wiki/spaces/BAH/overview)
