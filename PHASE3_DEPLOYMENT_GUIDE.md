# Phase 3 - Deployment Guide

**Project**: Time & Attendance App for Security Guard Workforce Management  
**Phase**: 3 (Deployment)  
**Status**: In Progress  
**Date**: 2026-02-06

---

## Executive Summary

This guide walks through deploying the Time & Attendance application to production. The app is fully built, tested, and ready for deployment. Choose your hosting platform and follow the step-by-step instructions below.

**Estimated Time**: 2-3 hours (including testing)  
**Difficulty**: Moderate  
**Prerequisites**: Supabase account, hosting platform account

---

## Pre-Deployment Checklist

Before starting deployment, ensure you have:

- [ ] Supabase production project access: https://oftdozvxmknzcowtfrto.supabase.co
- [ ] Regenerated Service Key (already done ✅)
- [ ] Hosting platform account (Vercel/Netlify/Fly.io)
- [ ] Custom domain (optional, but recommended)
- [ ] Email for SSL certificates
- [ ] GitHub or Git access for CI/CD (if using)
- [ ] Time: ~3 hours for full setup

---

## Step 1: Database Schema Deployment

### 1.1 Access Supabase Production

1. Go to: https://oftdozvxmknzcowtfrto.supabase.co
2. Login with your credentials
3. Navigate to **SQL Editor** (left sidebar)

### 1.2 Apply Phase 2 Schema

The Phase 2 schema extends the Phase 1 database with:
- User profiles management
- Break tracking
- Geofence violation logs
- Push notification logs
- Rate limit tracking
- Enhanced time entries

**Steps**:

1. In SQL Editor, click **New Query**
2. Copy the contents of `schema-phase2.sql`
3. Paste into the query editor
4. Click **Run**
5. Verify: No errors appear

**Expected Output**:
```
Tables created:
✅ user_profiles
✅ breaks
✅ geofence_violations_log
✅ push_notifications_log
✅ rate_limit_checks

Functions created:
✅ haversine_distance()
✅ is_within_geofence()
✅ calculate_total_hours()
✅ check_rate_limit()
✅ validate_wifi_geofence()
✅ get_current_shift()
✅ get_total_break_time()
✅ log_geofence_violation()

RLS Policies applied: ✅
Indexes created: ✅
```

### 1.3 Verify Schema

In Supabase dashboard:
- [ ] Check **Database** → **Tables**
- [ ] Verify all 5 new tables exist
- [ ] Check each table has correct columns
- [ ] Verify RLS policies are in place

---

## Step 2: Environment Variables

### 2.1 Gather Production Keys

**From Supabase Dashboard**:

1. Go to **Settings** → **API**
2. Copy **Project URL** → Paste as `VITE_SUPABASE_URL`
3. Copy **Anon (public)** key → Paste as `VITE_SUPABASE_ANON_KEY`
4. Copy **Service Role** key → Save securely (DO NOT commit to git)

### 2.2 Update .env.production

File: `.env.production` (already created)

**Fill in these values**:

```bash
# Required - From Supabase
VITE_SUPABASE_URL="https://oftdozvxmknzcowtfrto.supabase.co"
VITE_SUPABASE_ANON_KEY="<YOUR_ANON_KEY>"
VITE_SUPABASE_SERVICE_KEY="<YOUR_SERVICE_KEY>"  # Never commit this!

# Required - Your Deployment URL (after you deploy)
VITE_APP_URL="https://attend.yourcompany.com"  # Or platform-provided URL
```

**Do NOT commit `.env.production` to git!**

---

## Step 3: Build for Production

### 3.1 Install Dependencies

```bash
cd /home/clawd/.openclaw/workspace/time-attend-app
npm install
```

Expected output: "added X packages"

### 3.2 Run Production Build

```bash
npm run build
```

**Expected Output**:
```
✓ 1234 modules transformed
✓ built in 45.23s

dist/
├── index.html
├── assets/
│   ├── index-xxx.js      (minified)
│   ├── index-xxx.css     (minified)
│   └── (other assets)
├── manifest.json
└── service-worker.js
```

**If errors appear**:
- Check Node.js version: `node --version` (should be 16+)
- Clear cache: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

### 3.3 Verify Build Size

```bash
ls -lh dist/assets/
```

**Expected**:
- Main JS bundle: 300-500 KB (gzipped)
- CSS bundle: 100-150 KB (gzipped)

If much larger, investigate unused dependencies.

---

## Step 4: Choose Hosting Platform

### Option A: Vercel (RECOMMENDED) ⭐

**Why Vercel?**
- Optimized for React/Vite
- Free tier sufficient for your needs
- Auto-deploys on git push
- Built-in monitoring and analytics
- Fast edge caching
- Simple domain setup

**Steps**:

1. **Sign up**: https://vercel.com/signup
2. **Import project**:
   - Click "New Project"
   - Select "Import an existing Git repository"
   - Connect your GitHub/GitLab account
   - Select the time-attend-app repository
3. **Configure**:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: Add your `.env.production` vars
4. **Deploy**: Click "Deploy"
5. **Custom domain** (optional):
   - Go to project settings
   - Add domain
   - Configure DNS records
   - Wait for SSL certificate (automatic)

**Deployment URL**: `https://time-attend-app.vercel.app` (or your custom domain)

### Option B: Netlify

**Steps**:

1. **Sign up**: https://app.netlify.com/signup
2. **Connect Git**: Link your repository
3. **Configure**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: Add all vars from `.env.production`
4. **Deploy**: Automatic
5. **Custom domain**: Set in site settings

### Option C: Fly.io (More Control)

**Steps**:

1. **Install CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Login**: `flyctl auth login`
3. **Create app**: `flyctl launch` (follow prompts)
4. **Deploy**: `flyctl deploy`

### Option D: Self-Hosted

**If you have your own server**:

```bash
# Build
npm run build

# Copy dist/ to your server
scp -r dist/ user@yourserver:/var/www/app/

# Configure nginx/apache to serve dist/index.html for all routes
# Set up HTTPS with Let's Encrypt
# Configure environment variables
```

---

## Step 5: Post-Deployment Configuration

### 5.1 Verify Deployment

1. **Access app**: Go to your deployment URL
2. **Check console**: Open DevTools (F12) → Check for errors
3. **Test mobile**: Open on mobile device
4. **Test geolocation**: Allow location permission
5. **Test offline**: Go offline, try clock-in (should queue)

### 5.2 Configure Monitoring

#### Option A: Sentry (Error Tracking)

1. **Create account**: https://sentry.io/signup/
2. **Create project**: Select "React" as platform
3. **Get DSN**: Copy your Sentry DSN
4. **Update .env.production**:
   ```
   VITE_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
   ```
5. **Deploy**: Re-deploy to apply changes

#### Option B: Supabase Monitoring

1. **Supabase Dashboard** → **Analytics**
2. **Enable monitoring**:
   - [ ] Query performance
   - [ ] Connection metrics
   - [ ] Error logs
3. **Set up alerts**:
   - High error rate (>1%)
   - Database down
   - Performance degradation

### 5.3 Configure Push Notifications

#### Web Push API (Already Implemented)

Push notifications work out-of-the-box with:
- Service worker registration
- User permission requests
- Automatic sending on clock-in/out
- Geofence violation alerts

**Test**:
1. Open app on mobile
2. Allow notifications when prompted
3. Clock in/out
4. Check that notification appears

#### Optional: Firebase Cloud Messaging

For more advanced features:

1. **Create Firebase project**: https://console.firebase.google.com
2. **Enable Cloud Messaging**:
   - Project Settings → Cloud Messaging
   - Copy Server API Key
3. **Update .env.production**:
   ```
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_PROJECT_ID="..."
   VITE_FIREBASE_MESSAGING_SENDER_ID="..."
   ```
4. **Deploy**: Re-deploy

---

## Step 6: Security Configuration

### 6.1 HTTPS Verification

- [ ] All URLs should start with `https://`
- [ ] No warnings in browser address bar
- [ ] SSL certificate valid

### 6.2 CORS Configuration

**Supabase Dashboard** → **Settings** → **API**

Add your deployment domain:
```
https://attend.yourcompany.com
https://time-attend-app.vercel.app
```

### 6.3 RLS Policies Verification

**Supabase Dashboard** → **Authentication** → **Policies**

Verify:
- [ ] Users can only see their own data
- [ ] Managers can see all employee data
- [ ] Admins have full access
- [ ] No data leakage

### 6.4 API Key Rotation

- [ ] Verify service keys are not in frontend code
- [ ] All API calls from backend only
- [ ] Rotate keys quarterly

---

## Step 7: Performance Testing

### 7.1 Core Metrics

Test with real users (100+ employees):

**Clock-in Response Time**
- Target: < 2 seconds
- Acceptable: < 5 seconds

**Dashboard Update Interval**
- Target: 10 seconds
- Real-time updates visible

**Geofence Check**
- Target: < 1 second
- No noticeable delay

**Mobile App Load Time**
- Target: < 3 seconds
- Acceptable: < 5 seconds

### 7.2 Load Testing

```bash
# With artillery (if installed)
artillery run load-test.yml

# With curl (manual)
for i in {1..100}; do
  curl https://yourapp.com &
done
```

### 7.3 Mobile Testing

Test on real devices:
- [ ] iPhone 12+
- [ ] iPhone SE
- [ ] Android 10+
- [ ] Android 11+

Test scenarios:
- [ ] Clock in/out
- [ ] Location tracking
- [ ] Break management
- [ ] Offline sync
- [ ] Push notifications

---

## Step 8: Post-Deployment Checklist

### First Hour
- [ ] App loads without errors
- [ ] All routes accessible
- [ ] Database connected
- [ ] Service worker loads
- [ ] No 500 errors in logs

### First Day
- [ ] 10+ users tested successfully
- [ ] Geofence validation works in field
- [ ] Mobile app performs well
- [ ] Manager dashboard shows real-time data
- [ ] Break timing accurate
- [ ] Rate limiting blocks duplicates
- [ ] PDF reports generate correctly
- [ ] Notifications deliver

### First Week
- [ ] Error rate < 0.1%
- [ ] Performance metrics normal
- [ ] No database issues
- [ ] No service worker issues
- [ ] All features stable
- [ ] No security incidents
- [ ] Positive user feedback

---

## Troubleshooting

### Build Fails

**Error**: `vite: not found`

**Solution**:
```bash
npm install
npm run build
```

**Error**: `Cannot find module 'X'`

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Fails

**Error**: `Maximum file size exceeded`

**Solution**: Check build output size
```bash
npm run build
du -sh dist/
```

If > 100MB, investigate:
- Unused dependencies: `npm audit`
- Large assets: check `public/`

**Error**: `Service worker not registering`

**Solution**:
- Verify HTTPS is enabled
- Check `index.html` has SW registration script
- Check browser console for errors

### App Not Loading

**Error**: `Cannot connect to database`

**Solution**:
1. Verify VITE_SUPABASE_URL is correct
2. Verify VITE_SUPABASE_ANON_KEY is correct
3. Check Supabase status: https://status.supabase.com
4. Check browser console for CORS errors

**Error**: `404 Not Found` when accessing non-root routes

**Solution**: Configure your host to serve `dist/index.html` for all routes

**Vercel**: Automatic ✓  
**Netlify**: Add `_redirects` file (see Netlify docs)  
**Self-hosted**: Configure nginx/apache rewrite rules

### Performance Issues

**Slow geofence checks**:
- Check location update interval (should be 5s)
- Verify database indexes created
- Check network latency

**Slow dashboard**:
- Check real-time subscription interval (should be 10s)
- Verify database query performance
- Check number of employees (>1000 may need pagination)

---

## Production Runbook

### Daily Tasks

- **Monitor error rates**: Check Sentry/logs
- **Verify uptime**: Check monitoring dashboard
- **Review user feedback**: Check support channels

### Weekly Tasks

- **Database maintenance**: Verify backups
- **Performance review**: Check metrics
- **Security audit**: Review access logs

### Monthly Tasks

- **Update dependencies**: `npm update`
- **Security patches**: Check npm audit
- **Performance optimization**: Analyze slow queries
- **Cost review**: Check hosting bills

### Emergency Procedures

**If database goes down**:
1. Check Supabase status
2. Try backup restoration
3. Notify users
4. ETA for recovery

**If SSL certificate expires**:
- Vercel/Netlify: Automatic renewal
- Self-hosted: Manually renew with Let's Encrypt

**If app becomes unresponsive**:
1. Check error logs
2. Check database connection
3. Restart (if applicable)
4. Rollback if recent deployment

---

## Next Steps After Deployment

### Immediate (Day 1)
1. Monitor error logs
2. Test all critical flows
3. Verify database backups
4. Set up monitoring alerts

### Short-term (Week 1)
1. Gather user feedback
2. Fix any critical issues
3. Optimize performance
4. Document known issues

### Medium-term (Month 1)
1. Plan Phase 3.1 enhancements:
   - Real-time employee map
   - Photo proof on clock-in
   - Email/SMS notifications
2. Analyze usage patterns
3. Plan capacity expansion

### Long-term (Quarter 1)
1. Advanced analytics dashboard
2. Mobile native app (React Native)
3. Multi-location support
4. Advanced reporting features

---

## Support & Resources

**Documentation**:
- PHASE2_FEATURES.md - Feature documentation
- QUICK_START_PHASE2.md - Quick reference
- DEPLOYMENT_CHECKLIST.md - Pre-deployment checklist

**External Resources**:
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev

**Getting Help**:
- Check error logs first
- Review browser console
- Check Supabase logs
- Review deployment logs (Vercel/Netlify)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-06 | Initial deployment guide |

---

**Last Updated**: 2026-02-06  
**Status**: Ready for Deployment  
**Questions?** Check troubleshooting section or contact support

