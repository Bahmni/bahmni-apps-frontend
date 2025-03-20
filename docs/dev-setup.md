# Connecting Your Local Development Environment to the Bahmni Server

Bahmni utilizes OpenMRS' session-based authentication. When a user logs in, OpenMRS generates a session and returns a `JSESSIONID` cookie. Subsequent API calls use this session for authentication until the session expires or the user logs out.

This guide will walk you through the process of connecting your local development environment to either a local Bahmni server or a remote environment.

To configure your local development environment to connect with a Bahmni server, follow these steps:

---

## 1. Set Up Bahmni Using Docker

### Install Docker and Docker Compose

- Download and install **Docker** based on your operating system.
- Verify that **Docker Compose** is installed by running:

  ```bash
  docker compose version
  ```

### Clone the Bahmni Docker Repository

- Open a terminal and execute the following command:

  ```bash
  git clone https://github.com/Bahmni/bahmni-docker.git
  ```

### Navigate to the Bahmni Docker Directory

```bash
cd bahmni-docker
```

### Start Bahmni Services Using the EMR Profile

Run the following command to initialize Bahmni services with the EMR profile:

```bash
docker compose -p bahmni up -d
```

This will start all the necessary services for the Bahmni EMR.

For more detailed information about getting started with Bahmni on Docker, refer to the [official documentation](https://bahmni.atlassian.net/wiki/spaces/BAH/pages/3117744129/Getting+Started+Quickly+with+Bahmni+on+Docker#Running-Bahmni-Standard).

---

## 2. Access the Bahmni Application

- Open your web browser and navigate to:

  [http://localhost](http://localhost)

- Log in using the default credentials:
  - **Username**: `superman`
  - **Password**: `Admin123`

---

## 3. Retrieve the `JSESSIONID` Cookie

- After logging in, open your browser's **Developer Tools**:

  - **Chrome**: Press `F12` or right-click and select **Inspect**.

- Navigate to the **Application** tab.

- Under **Storage**, click on **Cookies** and select `http://localhost`.

- Locate the `JSESSIONID` cookie and copy its value.

---

## 4. Configure Your Development Environment

### Set the `JSESSIONID` Cookie

- Start the dev server and open `http://localhost:3000` on Chrome.
- In **Developer Tools**, under the **Application** tab, go to **Cookies**.
- Add a new cookie with the following details:
  - **Name**: `JSESSIONID`
  - **Value**: _(Paste the copied `JSESSIONID` value)_

### Modify Webpack Proxy Configuration

#### For Local Bahmni Server

All requests to the `\openmrs` context will be redirected to your local Bahmni development environment. This configuration is defined in the `webpack.config.js` file under the `devServer.proxy` section.

#### For Remote Environments

If you need to connect to a remote Bahmni environment instead of your local server:

1. Open your project's `webpack.config.js` file
2. Locate the `devServer.proxy` configuration
3. Change the `target` value to point to your remote environment:

```javascript
devServer: {
  // Other devServer settings...
  proxy: [
    {
      context: ['/openmrs'],
      target: 'https://your-remote-environment.example.com/',  // Replace with your environment URL
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
    },
  ],
}
```

This ensures API requests are correctly proxied to the appropriate Bahmni server.

---

## 5. Verify the Connection

- Restart your development server to apply the changes:

  ```bash
  yarn start
  ```

- Access your local development environment (typically at http://localhost:3000) and verify seamless communication with the Bahmni server.

- You can confirm the connection is working by checking the network requests in your browser's Developer Tools. You should see successful API calls to the `/openmrs` endpoints.

## 6. Troubleshooting

### Session Expiration

- The `JSESSIONID` cookie has a limited lifespan. If you encounter authentication errors, it may have expired.
- Simply repeat the process of logging into the Bahmni application and copying the new `JSESSIONID` value to your development environment.

### CORS Issues

- If you encounter CORS (Cross-Origin Resource Sharing) errors, ensure that:
  1. Your proxy configuration is correct
  2. The `changeOrigin` setting is set to `true`
  3. You've restarted your development server after making changes

### Connection Refused

- If you see "Connection Refused" errors, verify that your Bahmni server is running.
- For local setups, check that the Docker containers are active:

  ```bash
  docker ps | grep bahmni
  ```

By following these steps, you will successfully establish a connection between your local development environment and the Bahmni server, enabling efficient development and testing.
