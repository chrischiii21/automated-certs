# 🚀 Deployment Guide: Certify Platform

Follow these steps to deploy your automated certificate platform to the web using **Vercel** and **Supabase**.

## 1. Prepare Your Supabase Backend
Before deploying the frontend, ensure your backend is ready:
- [ ] **Run Schema**: Ensure you've executed the latest `supabase/schema.sql` in the Supabase SQL Editor.
- [ ] **Create Bucket**: Go to **Storage**, create a bucket named `templates`, and set it to **Public**.

## 2. Push Your Code to GitHub
Vercel works best when connected to a Git repository.
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial build: Certify Platform"

# Create a repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## 3. Deploy to Vercel
1.  Go to [Vercel.com](https://vercel.com) and log in.
2.  Click **Add New...** > **Project**.
3.  Import your GitHub repository.
4.  **IMPORTANT: Environment Variables**
    Expand the "Environment Variables" section and add the following from your `.env` file:
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon/Public Key.
5.  Click **Deploy**.

## 4. Post-Deployment Checklist
- [ ] **Verify Claims**: Visit `your-app.vercel.app/claim/[some-event-id]` to test the public experience.
- [ ] **Test Admin**: Go to the root `/` (your dashboard) and try creating a new event.
- [ ] **Custom Domain**: You can add your own domain for free in the Vercel project settings.

## 🛠️ Tech Stack Maintenance
- **Frontend**: Next.js (App Router) on Vercel (Free Tier).
- **Backend**: Supabase Postgres + Storage (Free Tier).
- **Image Generation**: HTML5 Canvas (Zero Cost, Client-Side).

Congratulations! Your automated certificate platform is now live and ready for the world.
