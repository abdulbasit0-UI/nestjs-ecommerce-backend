# E‑Commerce Backend (NestJS)

A production‑ready e‑commerce REST API built with NestJS, TypeORM, and PostgreSQL. Includes authentication, product/catalog management, orders and Stripe payments, file uploads to AWS S3, and transactional emails.


## Features
- Authentication and authorization with JWT (access + email verification + password reset)
- Users, addresses and profile management
- Brands, categories, and products with slug utility
- Orders and Stripe payments with secure webhook handling
- File uploads to AWS S3 (Multer + AWS SDK)
- Transactional emails via Nodemailer/Mailer (Handlebars templates)
- PostgreSQL with TypeORM (sync in development)
- Validation, global pipes, and Swagger API docs
- Dockerfile and docker‑compose for local database


## Tech Stack
- NestJS 11, TypeScript 5
- TypeORM 0.3, PostgreSQL 16
- JWT (passport‑jwt), bcrypt
- Stripe 18
- AWS SDK v3 (S3), multer‑s3
- Nodemailer, @nestjs-modules/mailer, Handlebars
- Swagger (OpenAPI)


## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 13+ (or use docker‑compose)

### Clone and install
```bash
npm install
```

### Start a local Postgres with Docker (optional)
This spins up a local Postgres at port 5432 with default credentials.
```bash
docker compose up -d
```
The compose file provisions:
- DB: `ecommerce_dev`, user: `postgres`, password: `postgres`.

### Environment variables
Create a `.env` in the project root. Use this template and adjust values:
```env
# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ecommerce_dev

# JWTs
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=1d
JWT_EMAIL_SECRET=replace-with-email-secret
JWT_EMAIL_EXPIRES_IN=1h
JWT_RESET_SECRET=replace-with-reset-secret
JWT_RESET_EXPIRES_IN=30m

# Mail (SMTP)
MAIL_HOST=smtp.example.com
MAIL_PORT=465
MAIL_USER=mailer@example.com
MAIL_PASS=your-smtp-password
MAIL_FROM=info@nexondigital.co.za

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket-name
AWS_S3_URL=https://your-bucket.s3.amazonaws.com

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```
Notes:
- TypeORM synchronize is enabled in development only (see `ormconfig.ts`). Do not use in production.
- The Mailer default `from` is `info@nexondigital.co.za` unless overridden by `MAIL_FROM`.

### Run the app
- Development (watch):
```bash
npm run start:dev
```
- Production build and start:
```bash
npm run build
npm run start:prod
```
The server logs:
- App: `http://localhost:<PORT>`
- Swagger UI: `http://localhost:<PORT>/api-docs`


## API Docs
Swagger is configured in `src/main.ts` with Bearer auth. Once the server is running, open:
- `http://localhost:3000/api-docs`


## Stripe Webhook
The webhook controller is mounted at `POST /webhook/stripe` and requires raw body for signature verification.
- Ensure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set.
- When running locally, forward events to your server, for example:
```bash
stripe login
stripe listen --forward-to localhost:3000/webhook/stripe
```
- The app uses `rawBody: true` on bootstrap to verify the Stripe signature. If you proxy the app, preserve the raw body.
- Events handled include `checkout.session.completed` and `payment_intent.succeeded` and mark orders as paid via `OrdersService`.


## File Uploads (AWS S3)
- S3 client is configured via `src/config/aws.config.ts` and injected as `s3Client`.
- Required envs: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and your bucket details (`AWS_S3_BUCKET`, `AWS_S3_URL`).
- Multer and `multer-s3` are used for streaming uploads.


## Emails
- Mailer config: `src/config/mail.config.ts`.
- Templating uses Handlebars. Templates live under `templates/` (e.g., `verify-email.hbs`, `reset-password.hbs`).
- Set SMTP via `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, and optionally `MAIL_FROM`.


## Project Structure (high level)
```
src/
  app.module.ts
  main.ts
  entities/          # TypeORM entities (User, Product, Order, ...)
  dtos/              # DTOs for validation/typing
  modules/
    auth/            # Auth controller/service, JWT strategies
    users/
    products/
    categories/
    brands/
    orders/
    payments/        # Stripe webhook controller
    mail/
    aws/
  common/            # guards, pipes, decorators, filters
  config/            # aws and mail configuration
utils/               # slug utility
```


## NPM Scripts
```bash
npm run start        # start app
npm run start:dev    # start in watch mode
npm run start:prod   # start compiled build
npm run build        # compile TypeScript
npm run lint         # eslint fix
npm run format       # prettier write
npm run test         # unit tests (jest)
npm run test:e2e     # e2e tests
```


## Docker
A `Dockerfile` builds the app image. To build and run:
```bash
docker build -t ecommerce-backend .
docker run -p 3000:3000 --env-file .env ecommerce-backend
```
A `docker-compose.yml` is provided for PostgreSQL. Start the DB first or point `DATABASE_*` to your own instance.


## Production Notes
- Set `NODE_ENV=production` and disable TypeORM synchronization (already off unless development).
- Use managed Postgres and S3 credentials with least privilege.
- Ensure `JWT_*` secrets are strong and rotated periodically.
- Configure HTTPS and a reverse proxy (e.g., Nginx) that preserves raw body for Stripe webhook.


## License
UNLICENSED (private). Update as needed.
