# Netlify Deployment Guide - Quick Start

**Target Platform**: Netlify  
**Estimated Time**: 5-10 minutes  
**Difficulty**: Easy  

---

## Prerequisites

- [ ] GitHub account (or GitLab/Bitbucket)
- [ ] Project pushed to git repository
- [ ] Supabase production keys ready
- [ ] Netlify account (free at https://app.netlify.com)

---

## Step 1: Create Netlify Account

1. Go to https://app.netlify.com/signup
2. Click "Continue with GitHub" (or your git provider)
3. Authorize Netlify to access your account
4. You'll be taken to dashboard

---

## Step 2: Connect Repository

1. Click "Add new site" → "Import an existing project"
2. Select your git provider (GitHub, GitLab, Bitbucket)
3. Find your `time-attend-app` repository
4. Click "Deploy site"

---

## Step 3: Configure Build Settings

**Important**: Set these values correctly

**Build command**: `npm run build`
**Publish directory**: `dist`

These should be detected automatically, but verify they're correct.

---

## Step 4: Add Environment Variables

1. Go to "Site settings" → "Build & deploy" → "Environment"
2. Click "Edit variables"
3. Add these variables:

```
VITE_SUPABASE_URL=https://oftdozvxmknzcowtfrto.supabase.co
VITE_SUPABASE_ANON_KEY=<copy from Supabase dashboard>
VITE_SUPABASE_PROJECT_ID=oftdozvxmknzcowtfrto
VITE_APP_ENV=production
```

4. Click "Save"
5. Trigger redeploy

---

## Step 5: Configure Routing

Netlify needs to serve `dist/index.html` for all routes (for React Router).

1. Create `_redirects` file in project root:

```
# Single Page App rewrite
/*    /index.html   200
```

2. Or add to `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

3. Git commit and push:

```bash
git add _redirects netlify.toml
git commit -m "Add Netlify routing configuration"
git push
```

4. Netlify auto-deploys and should now work

---

## Step 6: Deploy

Once environment variables are saved:

1. Click "Deployments" tab
2. Click "Deploy site" button
3. Wait 3-5 minutes
4. See "Site is live" when complete

**Your Live URL**: Netlify will show you the URL
- Example: `https://time-attend-app.netlify.app`
- Copy this - you'll need it for configuration

---

## Step 7: Add Custom Domain (Optional)

1. Go to "Site settings" → "Domain management"
2. Click "Add domain"
3. Enter your domain: `attend.yourcompany.com`
4. Follow DNS setup instructions
5. Netlify auto-provisions SSL certificate (takes 5-10 minutes)

---

## Step 8: Test Deployment

1. Open your Netlify URL in browser
2. Allow location permission
3. Test clock in/out functionality
4. Test on mobile device
5. Open DevTools (F12) and check for errors

---

## Auto-Deploy on Git Push

Netlify automatically redeploys when you push to your branch:

```bash
git commit -m "Update app"
git push origin main
```

Netlify will:
- Detect the push
- Build automatically
- Deploy to production
- Keep old versions for rollback

---

## Rollback a Deployment

If something breaks:

1. Go to "Deployments" tab
2. Find the previous working deployment
3. Click "..." menu → "Publish deploy"
4. App instantly reverts

---

## Monitor Your Deployment

**Netlify Dashboard**:
- **Deploys**: See deployment history
- **Functions**: Check edge function logs
- **Analytics**: See traffic and performance

**Supabase Dashboard**:
- Check database logs
- Monitor query performance
- View real-time statistics

---

## Environment Variable Management

To update environment variables:

1. Go to "Site settings" → "Build & deploy" → "Environment"
2. Click "Edit variables"
3. Update or add variables
4. Trigger redeploy with "Trigger deploy" button

---

## Troubleshooting

**Build fails**
- Check build logs: Go to "Deployments" → click deployment → "Build logs"
- Common issue: missing Node modules
- Solution: `rm -rf node_modules && npm install`

**Routes not working (404 errors)**
- You didn't add the `_redirects` file
- Create `_redirects` in project root with routing configuration
- See Step 5 above

**Cannot connect to Supabase**
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_ANON_KEY` is exact copy
- Check Supabase project is running

**Custom domain not working**
- DNS changes take time (up to 24 hours)
- Verify DNS records are correct
- Clear browser cache

**Service worker not loading**
- Verify HTTPS enabled (Netlify does this automatically)
- Check that `manifest.json` exists
- Check browser console for errors

---

## Performance Tips

**Reduce Build Time**:
1. Install dependencies locally before pushing
2. Use git ignore for node_modules
3. Optimize images in public folder

**Optimize Runtime**:
1. Enable compression: Done automatically
2. Enable caching: Done automatically
3. Use lazy loading for routes

---

## Comparison: Netlify vs Vercel

| Feature | Netlify | Vercel |
|---------|---------|--------|
| Setup Time | 5 min | 5 min |
| Deploy Speed | Medium | Fast |
| Free Tier | 100GB/month | Generous |
| Custom Domain | Yes | Yes |
| Routing Help | Needs config | Auto |
| Support | Good | Excellent |

**For this project**: Both work equally well. Vercel is slightly faster.

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

