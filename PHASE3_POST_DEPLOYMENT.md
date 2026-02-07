# Phase 3 - Post-Deployment Verification & Operations Guide

**Project**: Time & Attendance App - Production Deployment  
**Phase**: 3  
**Date**: 2026-02-06  
**Status**: Ready for Deployment  

---

## Overview

This guide covers post-deployment verification, monitoring, maintenance, and troubleshooting for the production Time & Attendance application.

---

## Part 1: Immediate Post-Deployment (First Hour)

### 1.1 Access Verification

**Task**: Verify the application is accessible

```bash
# Test deployment URL
curl -I https://your-deployment-url/
# Expected: HTTP 200
```

**Checklist**:
- [ ] App loads in browser
- [ ] No CORS errors in console (F12)
- [ ] No TypeScript errors
- [ ] Service worker loads (check Application tab)
- [ ] Manifest.json loads (check Network tab)

### 1.2 Authentication Test

1. Open app in browser
2. Look for login/sign-up option
3. Verify authentication flow works
4. Check that session persists

**Expected**:
- [ ] Login page loads
- [ ] Can enter credentials
- [ ] Can submit form
- [ ] Redirects after authentication

### 1.3 Database Connectivity

1. Open DevTools → Network tab
2. Perform an action (clock-in test)
3. Check API calls to Supabase

**Expected**:
- [ ] No 401 Unauthorized errors
- [ ] No 403 Forbidden errors
- [ ] CORS requests succeed
- [ ] Real-time subscriptions work

### 1.4 Service Worker Verification

1. Open DevTools → Application → Service Workers
2. Verify status is "activated"
3. Check scopes

**Expected**:
- [ ] Service worker active
- [ ] Scope shows correct app URL
- [ ] No red errors

### 1.5 Push Notification Setup

1. Open app
2. Grant notification permission when prompted
3. Go to DevTools → Application → Manifest
4. Verify manifest.json loads

**Expected**:
- [ ] Permission prompt appears
- [ ] Permission grants successfully
- [ ] Manifest shows correct fields

---

## Part 2: First Day Testing (4-8 Hours)

### 2.1 Core Functionality Testing

**Clock In/Out**:
1. [ ] Clock in button works
2. [ ] Location captured
3. [ ] Time recorded in database
4. [ ] Manager can see the clock-in

**Geofence Validation**:
1. [ ] Geofence status shows (in zone/warning/out)
2. [ ] Accuracy displays
3. [ ] Warning triggers at 50% radius
4. [ ] Violation logs created

**Break Management**:
1. [ ] Start break works
2. [ ] Break timer runs
3. [ ] Stop break saves duration
4. [ ] Multiple breaks tracked

**Manager Dashboard**:
1. [ ] Shows real-time employee count
2. [ ] Updates every 10 seconds
3. [ ] Shows violation log
4. [ ] Shows activity log
5. [ ] Can view different tabs

### 2.2 Mobile Device Testing

Test on real devices:

**iPhone**:
- [ ] App loads on Safari
- [ ] Location permission works
- [ ] Touch controls responsive
- [ ] Landscape/portrait works
- [ ] App installable

**Android**:
- [ ] App loads on Chrome
- [ ] Location permission works
- [ ] Touch controls responsive
- [ ] Can install as PWA
- [ ] Orientation changes work

### 2.3 Offline Testing

1. Open app
2. Record position (note lat/lng)
3. Go offline (browser DevTools or disable WiFi)
4. Try to clock in/out
5. Go back online
6. Verify sync occurs

**Expected**:
- [ ] Can interact while offline
- [ ] Shows "offline" indicator
- [ ] Auto-syncs when online
- [ ] No data loss

### 2.4 Performance Testing

**Page Load Time**:
- [ ] Home page: < 3 seconds
- [ ] Manager dashboard: < 2 seconds
- [ ] Mobile app: < 3 seconds

**Location Updates**:
- [ ] Update every 5 seconds
- [ ] No lag in geofence status

**Dashboard Updates**:
- [ ] Real-time every 10 seconds
- [ ] No slowdown with 100+ employees

### 2.5 Notification Testing

1. Clock in/out and verify notification appears
2. Trigger geofence violation and verify alert
3. Check notification log in database

**Expected**:
- [ ] Notifications appear in time
- [ ] Content is correct
- [ ] Clicking notification works
- [ ] Notifications logged in database

---

## Part 3: First Week Monitoring

### 3.1 Daily Checks

**Every Morning**:
- [ ] Check error logs (Sentry or Supabase)
- [ ] Review error rate (should be < 0.1%)
- [ ] Check database performance
- [ ] Verify no service interruptions

**Commands**:
```bash
# Check if service worker is registered
curl -H "User-Agent: Mozilla/5.0" https://your-url/service-worker.js

# Check build status (if using CI/CD)
# Go to your platform dashboard (Vercel/Netlify)
```

### 3.2 Error Log Review

**In Sentry** (if set up):
1. Go to https://sentry.io
2. Select your project
3. Look for errors
4. Triage and assign
5. Add to backlog if needed

**Common errors to watch for**:
- Service worker installation errors
- Geofence calculation errors
- Database permission denied
- Missing environment variables

### 3.3 Database Health

**In Supabase Dashboard**:
1. Go to Analytics tab
2. Check query performance
3. Look for slow queries
4. Review error logs

**Metrics to watch**:
- Query response time (should be < 100ms)
- Connection count (should be stable)
- CPU usage (should be < 80%)
- Disk usage (should be < 80%)

### 3.4 User Feedback Collection

- [ ] Set up feedback form
- [ ] Monitor support emails
- [ ] Track bug reports
- [ ] Note feature requests

**Weekly Review**:
- Common complaints
- Missing features
- Performance issues
- Usability problems

---

## Part 4: Ongoing Maintenance

### 4.1 Weekly Tasks

**Every Monday**:
1. **Review metrics** (5 min)
   - Error rate
   - Performance metrics
   - Database health

2. **Review feedback** (15 min)
   - User reports
   - Support tickets
   - Feature requests

3. **Check dependencies** (5 min)
   ```bash
   npm audit
   # Review vulnerabilities
   ```

4. **Review logs** (10 min)
   - Sentry dashboard
   - Database errors
   - Deployment logs

### 4.2 Monthly Tasks

**First of each month**:

1. **Update dependencies** (30 min)
   ```bash
   npm update
   npm audit fix
   npm run build
   # Test thoroughly before deploying
   ```

2. **Performance review** (30 min)
   - Analyze slow queries
   - Review bundle size
   - Check Core Web Vitals

3. **Security audit** (30 min)
   - Review access logs
   - Check for unauthorized access
   - Verify SSL certificate valid

4. **Cost review** (15 min)
   - Check hosting bills
   - Review database costs
   - Plan budget for next month

5. **Backup verification** (15 min)
   - Test database restoration
   - Verify backups automated
   - Document retention policy

### 4.3 Quarterly Tasks

**Every 3 months**:

1. **Architecture review**
   - Assess scalability
   - Plan for growth
   - Identify bottlenecks

2. **Feature roadmap**
   - Review user feedback
   - Plan next features
   - Prioritize requests

3. **Performance optimization**
   - Profile application
   - Optimize slow functions
   - Reduce bundle size

4. **Team training**
   - Update documentation
   - Train new team members
   - Share best practices

---

## Part 5: Monitoring Setup

### 5.1 Sentry Configuration (Recommended)

**Step 1**: Create Sentry account
- Go to https://sentry.io/signup/
- Create free account

**Step 2**: Create project
- Select "React" platform
- Get your DSN (Data Source Name)

**Step 3**: Add to environment
```env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=1.0.0
```

**Step 4**: Deploy
- Redeploy application
- Errors will now be tracked

**Dashboard**:
- See all errors in real-time
- Filter by severity
- View stack traces
- Assign to team members
- Set up alerts

### 5.2 Supabase Monitoring

**In Dashboard**:
1. Go to Analytics tab
2. Enable real-time monitoring
3. Set up alerts for:
   - Query performance (> 100ms)
   - Error rate (> 1%)
   - Connection limit (> 80%)

**Setting up alerts**:
1. Go to Database → Monitoring
2. Create alert rule
3. Set notification channel (email)
4. Test alert

### 5.3 Uptime Monitoring

**Option A**: Vercel/Netlify built-in
- Automatic health checks
- Email notifications on outage

**Option B**: External service
- https://uptime.com
- https://statuspage.io
- https://betterstack.com

**Check frequency**: Every 5-10 minutes

---

## Part 6: Emergency Procedures

### 6.1 App Not Loading

**Symptoms**: Users report blank page or error

**Troubleshooting**:

1. **Check deployment**
   - Vercel/Netlify dashboard
   - Look for recent deployments
   - Check build logs for errors

2. **Clear cache**
   - Tell users to force-refresh: Ctrl+Shift+R
   - Clear application cache

3. **Check service worker**
   - DevTools → Application → Service Workers
   - Unregister if broken
   - Force refresh

4. **Rollback**
   - Go to deployments
   - Select previous working version
   - Click "Promote to Production"

### 6.2 Database Down

**Symptoms**: Cannot connect to database, 500 errors

**Troubleshooting**:

1. **Check Supabase status**
   - https://status.supabase.com
   - Look for ongoing incidents

2. **Check credentials**
   - Verify `VITE_SUPABASE_URL` correct
   - Verify `VITE_SUPABASE_ANON_KEY` correct
   - Check environment variables

3. **Restore from backup**
   - Supabase Dashboard → Backups
   - Select latest backup
   - Click "Restore"
   - Takes 5-15 minutes

4. **Notify users**
   - Post status update
   - Estimate recovery time
   - Provide workaround if possible

### 6.3 Performance Degradation

**Symptoms**: Slow load times, laggy interactions

**Troubleshooting**:

1. **Check metrics**
   - Sentry dashboard
   - Check error rate
   - Review slow transactions

2. **Monitor database**
   - Check query performance
   - Look for slow queries
   - Check connection limit

3. **Scale infrastructure**
   - Upgrade Supabase tier (if needed)
   - Enable CDN caching
   - Optimize queries

4. **Optimize frontend**
   - Clear browser cache
   - Restart service worker
   - Check for memory leaks

### 6.4 Security Breach

**Symptoms**: Unauthorized access, data leak

**Immediate Actions**:

1. **Revoke API keys**
   - Supabase Dashboard → Settings → API
   - Generate new keys
   - Update environment variables
   - Redeploy

2. **Review access logs**
   - Supabase Dashboard → Database
   - Check query logs
   - Identify compromised data

3. **Reset user passwords**
   - If user credentials leaked
   - Force password reset for all users

4. **Notify affected users**
   - Send email to all users
   - Explain what happened
   - Advise password reset

5. **Investigate root cause**
   - Review access patterns
   - Check for vulnerabilities
   - Implement fixes

---

## Part 7: Performance Optimization

### 7.1 Frontend Optimization

**Bundle Size**:
```bash
# Check bundle size
npm run build
ls -lh dist/assets/
```

**If > 2MB**:
- [ ] Code splitting by route
- [ ] Lazy loading components
- [ ] Remove unused dependencies

**Caching**:
- [ ] Set long TTL for static assets (1 year)
- [ ] Set short TTL for HTML (1 hour)
- [ ] Enable gzip compression (automatic)
- [ ] Enable Brotli compression (Vercel)

### 7.2 Database Optimization

**Indexes**:
- [ ] All join columns indexed
- [ ] All filter columns indexed
- [ ] Check index usage stats

**Query optimization**:
```sql
-- EXPLAIN to understand query plans
EXPLAIN ANALYZE
SELECT * FROM time_entries
WHERE employee_id = 'xxx' AND created_at > now() - interval '7 days';
```

**Connection pooling**:
- [ ] Enable connection pooling
- [ ] Set appropriate pool size
- [ ] Monitor connection usage

### 7.3 Network Optimization

**CDN**:
- [ ] Enable CDN for static assets (automatic on Vercel)
- [ ] Cache image assets
- [ ] Compress images

**API Optimization**:
- [ ] Reduce number of requests
- [ ] Batch requests when possible
- [ ] Use real-time subscriptions instead of polling

---

## Part 8: Runbook Summary

### Quick Reference

**Daily**:
- Check error logs
- Verify database health
- Review user feedback

**Weekly**:
- Review metrics
- Update dependencies
- Test backups

**Monthly**:
- Update packages
- Performance review
- Security audit
- Cost review

**Quarterly**:
- Architecture review
- Feature planning
- Optimization sprint
- Team training

### Contact & Escalation

**Level 1 - Basic Issues** (< 1 hour impact)
- Cache clear
- Service worker reset
- Browser restart

**Level 2 - Moderate Issues** (1-4 hour impact)
- Rollback deployment
- Restart services
- Restore from backup

**Level 3 - Critical Issues** (> 4 hour impact)
- Database recovery
- Infrastructure failover
- Incident investigation
- Post-mortem review

---

## Part 9: Documentation & Training

### Documentation Checklist

- [ ] Keep README.md updated
- [ ] Document deployment procedure
- [ ] Document rollback procedure
- [ ] Maintain architecture diagram
- [ ] Update runbook regularly

### Team Training

**New team members should know**:
1. How to deploy changes
2. How to rollback if needed
3. How to debug common issues
4. How to monitor production
5. Emergency procedures

### Knowledge Base

Create articles for:
- How to clock in/out
- How to manage breaks
- How to view reports
- How to reset password
- How to contact support

---

## Success Metrics

Track these metrics weekly:

**Availability**:
- [ ] Uptime > 99.5%
- [ ] Response time < 500ms
- [ ] Error rate < 0.1%

**User Experience**:
- [ ] Load time < 3s
- [ ] Dashboard update < 10s
- [ ] Location update < 5s

**Business Metrics**:
- [ ] Employee adoption > 80%
- [ ] User satisfaction > 4/5
- [ ] Support tickets < 2/week

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-06 | Initial post-deployment guide |

---

**Questions?** See PHASE3_DEPLOYMENT_GUIDE.md or TROUBLESHOOTING.md

