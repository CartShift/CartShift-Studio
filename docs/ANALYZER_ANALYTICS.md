# Store Analyzer Analytics Tracking

## Overview

Comprehensive analytics tracking has been implemented for the Store Analyzer to monitor usage, performance, and failure rates.

## Events Tracked

### 1. Analysis Started

**Event**: `store_analysis_started`

**Parameters**:

- `store_url` - The URL being analyzed

**Triggered**: When user submits the analyzer form

---

### 2. Analysis Completed

**Event**: `store_analysis_completed`

**Parameters**:

- `store_url` - The URL that was analyzed
- `overall_score` - Final score (0-100)
- `platform` - Detected platform (Shopify, WooCommerce, etc.)
- `duration_ms` - Total analysis time in milliseconds
- `has_puppeteer` - Whether Puppeteer features were available
- `has_visual_analysis` - Whether screenshots were captured
- `has_product_analysis` - Whether product page was analyzed
- `has_competitor_analysis` - Whether competitors were found
- `has_ai_analysis` - Whether AI readiness was analyzed

**Triggered**: When analysis completes successfully

**Use Cases**:

- Monitor success rate
- Track average analysis time
- Measure Puppeteer availability
- Identify platform distribution

---

### 3. Analysis Failed

**Event**: `store_analysis_failed`

**Parameters**:

- `store_url` - The URL that failed
- `error_message` - The error message
- `error_type` - Classification: `network` | `timeout` | `validation` | `server` | `unknown`
- `duration_ms` - Time until failure

**Triggered**: When analysis encounters an error

**Error Types**:

- **network**: Fetch/connectivity issues
- **timeout**: Request exceeded time limit
- **validation**: Invalid URL or missing required fields
- **server**: Server-side errors (500, etc.)
- **unknown**: Unclassified errors

**Use Cases**:

- Monitor failure rate
- Identify common error types
- Debug problematic URLs
- Improve error handling

---

### 4. Service Failure

**Event**: `analyzer_service_failure`

**Parameters**:

- `service_name` - Which service failed: `puppeteer` | `pagespeed` | `competitor` | `ai` | `cache` | `benchmark`
- `error_message` - The error message
- `graceful_degradation` - Whether analysis continued (boolean)

**Triggered**: When an individual service fails but analysis continues

**Use Cases**:

- Monitor Puppeteer availability across environments
- Track PageSpeed API issues
- Measure graceful degradation effectiveness
- Identify problematic services

---

### 5. Feature Unavailable

**Event**: `analyzer_feature_unavailable`

**Parameters**:

- `feature_name` - Which feature: `visual_analysis` | `product_analysis`
- `reason` - Why unavailable: `puppeteer_unavailable` | `no_product_page_or_puppeteer_unavailable`

**Triggered**: When a feature is skipped due to unavailability

**Use Cases**:

- Track Puppeteer deployment issues
- Measure feature completion rate
- Justify infrastructure investments

---

### 6. Newsletter Signup

**Event**: `newsletter_signup`

**Parameters**:

- `signup_location` - Always `store_analyzer`

**Triggered**: When user opts into newsletter during analysis

**Use Cases**:

- Measure conversion rate
- Track lead generation

---

## Dashboard Metrics

### Key Performance Indicators (KPIs)

1. **Success Rate**

   ```
   (store_analysis_completed / store_analysis_started) × 100
   ```

2. **Average Analysis Time**

   ```
   AVG(duration_ms) from store_analysis_completed
   ```

3. **Puppeteer Availability**

   ```
   (has_puppeteer:true / total_analyses) × 100
   ```

4. **Feature Completion Rates**

   ```
   Visual Analysis: (has_visual_analysis:true / total) × 100
   Product Analysis: (has_product_analysis:true / total) × 100
   ```

5. **Error Distribution**

   ```
   GROUP BY error_type from store_analysis_failed
   ```

6. **Newsletter Conversion Rate**
   ```
   (newsletter_signups / store_analysis_started) × 100
   ```

---

## Google Analytics 4 Setup

### Custom Dimensions (Recommended)

1. **Store Platform** (User-scoped)
   - Tracks most common platforms analyzed per user

2. **Analysis Duration** (Event-scoped)
   - Segments: <10s, 10-20s, 20-30s, >30s

3. **Feature Availability** (Event-scoped)
   - Tracks Puppeteer availability trends

### Custom Events

All events are automatically tracked via `lib/analytics.ts`. Ensure GA4 is configured:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Recommended Reports

1. **Analysis Funnel**
   - Started → Completed → Newsletter Signup

2. **Error Analysis**
   - By error_type, platform, time of day

3. **Performance Monitoring**
   - Average duration by platform
   - Feature availability over time

4. **Platform Distribution**
   - Which platforms are most analyzed

---

## Implementation Details

### Client-Side Tracking

Location: `components/sections/StoreAnalyzerContent.tsx`

- Tracks user-facing events (started, completed, failed)
- Captures timing information
- Classifies error types automatically

### Server-Side Tracking

Location: `lib/services/analyzer.ts`

- Tracks service-level failures
- Monitors graceful degradation
- Logs performance metrics

### Analytics Library

Location: `lib/analytics.ts`

New functions:

- `trackAnalyzerStarted()`
- `trackAnalyzerCompleted()`
- `trackAnalyzerFailed()`
- `trackAnalyzerServiceFailure()`
- `trackAnalyzerFeatureUnavailable()`

---

## Monitoring Alerts (Recommended)

Set up alerts in your analytics platform:

1. **Critical**:
   - Success rate < 80%
   - Average duration > 45s
   - Error rate > 20%

2. **Warning**:
   - Puppeteer availability < 90%
   - Service failure rate > 5%
   - Newsletter conversion < 10%

3. **Info**:
   - New platform detected
   - Unusual traffic spike
   - Geographic anomalies

---

## Privacy Considerations

- Store URLs are hashed before sending to analytics (if required by privacy policy)
- No personally identifiable information (PII) is tracked
- Email addresses are NOT sent to analytics
- GDPR/CCPA compliant with proper consent

---

## Testing

Test analytics in development:

```bash
# 1. Check analytics are firing
NODE_ENV=development pnpm dev

# 2. Look for console logs
[GA] store_analysis_started { store_url: 'https://example.com' }
[GA] store_analysis_completed { overall_score: 85, ... }

# 3. Use GA Debug View
# Enable in Chrome: chrome://flags/#enable-experimental-web-platform-features
```

---

## Future Enhancements

Potential additions:

- [ ] User flow tracking (where users came from)
- [ ] A/B testing integration
- [ ] Heatmap integration for results page
- [ ] Export/share event tracking
- [ ] Comparison feature usage
- [ ] Time-to-first-insight metric
- [ ] User satisfaction survey trigger

---

**Last Updated**: February 5, 2026
**Version**: 1.0.0
