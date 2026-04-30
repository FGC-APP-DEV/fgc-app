local-dev-server

# Local Development Server

When opening the browser for local development:

- Always use the port that is native for the framework being used (or specified in .env / package.json files)
  - Example: localhost:3000 - keep that port always
- If the designated port is being used, DO NOT open a new one, KILL the running port and RESTART it.
