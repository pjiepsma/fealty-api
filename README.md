# Payload Blank Template

This template comes configured with the bare minimum to get started on anything you need.

## Quick start

This template can be deployed directly from our Cloud hosting and it will setup MongoDB and cloud S3 object storage for media.

## Quick Start - local setup

To spin up this template locally, follow these steps:

### Clone

After you click the `Deploy` button above, you'll want to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

### Development

1. First [clone the repo](#clone) if you have not done so already
2. Create a `.env` file in the root directory with the following environment variables:
   ```env
   # Payload CMS Configuration
   PAYLOAD_SECRET=your-secret-key-here
   DATABASE_URL=mongodb://127.0.0.1:27017/payload

   # Resend Email Configuration
   RESEND_API_KEY=re_V4fvqrg2_6wUzxHbCGgdE2WrCJmLdzGWz
   RESEND_FROM_EMAIL=noreply@deelbaar.com
   RESEND_FROM_NAME=Fealty

   # Payload Jobs Configuration
   ENABLE_PAYLOAD_AUTORUN=true
   ```
   
   **Note**: The `DATABASE_URL` should point to `mongodb://127.0.0.1:27017/payload` as the dev script will start an in-memory MongoDB server on that port.
   
   **Note**: 
   - Get your `RESEND_API_KEY` from [Resend](https://resend.com/)
   - The `RESEND_FROM_EMAIL` should be a verified domain email or use `onboarding@resend.dev` for testing
   - For production, use your verified domain email (e.g., `noreply@yourdomain.com`)
   - `ENABLE_PAYLOAD_AUTORUN=true` enables Payload's job scheduler for cron jobs (challenge assignment, expiration cleanup, daily decay)

3. `pnpm install && pnpm dev` to install dependencies and start both the MongoDB server and the Payload CMS server
4. open `http://localhost:4000` to open the app in your browser

**Note**: The `dev` command uses `concurrently` to start both the MongoDB in-memory server and the Payload CMS server. The CMS runs on port 4000, and MongoDB runs on port 27017.

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

#### Docker (Optional)

If you prefer to use Docker for local development instead of a local MongoDB instance, the provided docker-compose.yml file can be used.

To do so, follow these steps:

- Modify the `MONGODB_URL` in your `.env` file to `mongodb://127.0.0.1/<dbname>`
- Modify the `docker-compose.yml` file's `MONGODB_URL` to match the above `<dbname>`
- Run `docker-compose up` to start the database, optionally pass `-d` to run in the background.

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Media

  This is the uploads enabled collection. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
