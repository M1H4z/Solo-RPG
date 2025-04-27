# 🚀 Deploying Solo-RPG to Vercel

## 🛠️ Step 1: Initial Setup

- Visit [https://vercel.com](https://vercel.com)
- Login with GitHub or create an account
- Click **New Project**
- Import your **Solo-RPG** GitHub repository
- Leave basic settings as default unless needed

---

## ⚙️ Step 2: Environment Variables

In your Vercel project dashboard:

- Go to **Settings > Environment Variables**
- Add the same variables from your local `.env.local` file

Example:

| Name                          | Value                                      |
| :---------------------------- | :----------------------------------------- |
| NEXT_PUBLIC_SUPABASE_URL      | your supabase project url                  |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | your supabase anon key                     |
| SUPABASE_SERVICE_ROLE_KEY     | your supabase service role key (if needed) |

> **Note:** Vercel cannot automatically detect local `.env.local`. You must add them manually.

---

## 🏗️ Step 3: Build Settings

Default build settings for Next.js projects:

| Setting          | Value           |
| :--------------- | :-------------- |
| Framework Preset | Next.js         |
| Build Command    | `npm run build` |
| Output Directory | `.next`         |

No custom config needed unless your project is special.

---

## 🚀 Step 4: Deploy

- Press **Deploy**!
- Vercel will install dependencies, build, and host your project
- You'll get a live URL like:
  ```
  https://solo-rpg.vercel.app
  ```

---

## 🔄 Step 5: After Deployment (Updating the Site)

- Every time you push to the GitHub `main` branch
- Vercel automatically rebuilds and redeploys the site
- No manual redeploy needed!

---

# ✅ Final Summary

| Task                      | Status |
| :------------------------ | :----- |
| Push project to GitHub    | ✅     |
| Connect repo to Vercel    | ✅     |
| Add environment variables | ✅     |
| Deploy                    | ✅     |
| Enjoy                     | 🎉     |
