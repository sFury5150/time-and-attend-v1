# Vercel Deployment Guide - Quick Start

**Target Platform**: Vercel  
**Estimated Time**: 5-10 minutes  
**Difficulty**: Easy  

---

## Prerequisites

- [ ] GitHub account (or GitLab/Bitbucket)
- [ ] Project pushed to git repository
- [ ] Supabase production keys ready
- [ ] Vercel account (free at https://vercel.com)

---

## Step 1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub" (or your git provider)
3. Authorize Vercel to access your account
4. You'll be taken to dashboard

---

## Step 2: Import Project

1. Click "Add New..." → "Project"
2. Click "Import an existing Git repository"
3. Find your `time-attend-app` repository
4. Click "Import"

---

## Step 3: Configure Project

**Framework**: Should auto-detect as "Vite"

**Build and Output Settings**:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Environment Variables** (add these):

```
VITE_SUPABASE_URL=https://oftdozvxmknzcowtfrto.supabase.co
VITE_SUPABASE_ANON_KEY=<copy from Supabase dashboard>
VITE_SUPABASE_PROJECT_ID=oftdozvxmknzcowtfrto
VITE_APP_ENV=production
```

**To get keys from Supabase**:
1. Go to https://oftdozvxmknzcowtfrto.supabase.co
2. Click Settings → API
3. Copy "Project URL" and "Anon (public) key"
4. Paste into Vercel environment variables

---

## Step 4: Deploy

1. Click "Deploy"
2. Wait 2-5 minutes for build to complete
3. You'll see: "Congratulations! Your project is ready"

**Your Live URL**: Vercel will show you the URL
- Example: `https://time-attend-app.vercel.app`
- Copy this - you'll need it for configuration

---

## Step 5: Add Custom Domain (Optional)

1. In Vercel dashboard, go to project
2. Click "Settings" → "Domains"
3. Enter your domain: `attend.yourcompany.com`
4. Follow DNS setup instructions
5. Wait 5-10 minutes for SSL certificate

---

## Step 6: Test Deployment

1. Open your Vercel URL in browser
2. Allow location permission
3. Test clock in/out functionality
4. Test on mobile device
5. Open DevTools (F12) and check for errors

---

## Auto-Deploy on Git Push

Vercel automatically redeploys when you push to your branch:

```bash
git commit -m "Update app"
git push origin main
```

Vercel will:
- Detect the push
- Build automatically
- Deploy to production
- Keep old versions for rollback

---

## Rollback a Deployment

If something breaks:

1. Go to Vercel project dashboard
2. Click "Deployments" tab
3. Find the previous working deployment
4. Click "..." menu → "Promote to Production"
5. App instantly reverts

---

## Monitor Your Deployment

**Vercel Dashboard**:
- **Analytics**: See traffic and performance
- **Function Logs**: Check API call logs
- **Error Logs**: See any build errors
- **Deployments**: See deployment history

**Supabase Dashboard**:
- Check database logs
- Monitor query performance
- View real-time statistics

---

## Environment Variable Management

To update environment variables:

1. Go to project in Vercel
2. Click "Settings" → "Environment Variables"
3. Edit or add variables
4. Redeploy with: "Deployments" → "..." → "Redeploy"

---

## Troubleshooting

**Build fails with "vite: not found"**
- Make sure `package.json` exists with `npm run build` command
- Check Node version is 16+

**Deployment URL not working**
- Wait 5 minutes - DNS propagation takes time
- Clear browser cache: Ctrl+Shift+Delete
- Try incognito window

**Cannot connect to Supabase**
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is copied exactly
- Check Supabase project is running

**Service worker not loading**
- Verify HTTPS enabled (Vercel does this automatically)
- Check that `manifest.json` exists in public folder
- Check browser console for errors

---

## Next Steps

After successful deployment:

1. **Configure monitoring** (Sentry)
2. **Set up backups** (Supabase)
3. **Test with real users**
4. **Monitor error logs**
5. **Gather feedback**

---

**Deployment Complete!**

Your app is now live at: `_____________________`

Keep this URL - you'll need it for configuration and sharing with employees.

