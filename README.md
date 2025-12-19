# LP Automatic Builder

WordPress-like vertical LP builder with Next.js, Tailwind, and DnD.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `DATABASE_URL` is set (e.g. `file:./dev.db`).

3. **Database Migration**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
   (Default password: `password123` or set `ADMIN_PASSWORD` in .env)

## Render Deployment

1. **Build Command**
   ```bash
   npm install && npx prisma migrate deploy && npm run build
   ```
2. **Start Command**
   ```bash
   npm start
   ```
3. **Environment Variables**
   Set `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_BASE_URL` in Render Dashboard.
   *Note: For SQLite on Render, you need a Persistent Disk mounted at `/opt/render/project/src/prisma` (custom) or similar, otherwise DB resets on deploy. Ideally switch to Postgres.*
4. **Image Uploads**
   Currently uses local `/public/uploads`. On Render, these vanish on redeploy without a Persistent Disk.
   *Recommendation: Switch `api/upload` to S3/Cloudinary for production.*

## Features
- **Admin Panel**: Pages List, Image Upload, DnD Sorting
- **Public View**: Sticky Header, Stacked Images, Form
- **Auth**: Simple JWT Admin Protection
