# Development Scripts

## Proposal-to-request migration

- `pnpm migrate:proposals` performs a read-only dry run and prints reconciliation totals and conflicts.
- `pnpm migrate:proposals:apply` writes canonical requests, aliases, payments, and related references.
- Resolve every reported conflict before applying; conflicts are never overwritten and exit with code `2`.

## Dev Force Scripts

These scripts automatically kill any existing Next.js dev processes and clear the cache before starting a fresh development server. This solves the common issue where Next.js can't acquire a lock because another instance is already running.

### PowerShell Script (`dev-force.ps1`)

**Usage:**

```bash
# Direct execution
powershell -ExecutionPolicy Bypass -File scripts/dev-force.ps1

# Via npm/pnpm
pnpm run dev:force
```

**Features:**

- Detects and terminates existing Next.js dev processes
- Clears the `.next` cache directory
- Starts a fresh development server
- Provides detailed feedback about each step

### Batch Script (`dev-force.bat`)

**Usage:**

```bash
# Via npm/pnpm
pnpm run dev:force:win
```

**Features:**

- Windows batch alternative for systems that prefer .bat files
- Same functionality as PowerShell script
- Uses Windows taskkill and rmdir commands

## Troubleshooting

If you still encounter issues:

1. **Manual cleanup:**

   ```powershell
   # Kill all node processes
   taskkill /IM node.exe /F

   # Clear cache manually
   Remove-Item -Recurse -Force .next
   ```

2. **Check for processes:**

   ```powershell
   Get-Process -Name node | Where-Object { $_.CommandLine -like "*next*" }
   ```

3. **Force restart:**
   - Close all terminals
   - Kill any remaining node processes
   - Run `pnpm run dev:force`

## Regular Development

`pnpm run dev` automatically frees known dev ports (3000, and emulator ports when using `--full`) before starting. If a port is still blocked after that, use `pnpm run dev:force` for a deeper cleanup.

```bash
pnpm run dev
```

## Social Publishing

Publish a LinkedIn post from a text file with optional ledger-backed idempotency:

```bash
pnpm run social:linkedin:publish -- --text-file path/to/post.txt --ledger-file data/social/linkedin-blog-post-ledger.json --slug my-post --title "Post title" --url https://cartshift.com/blog/my-post
```

Dry run:

```bash
pnpm run social:linkedin:publish:dry-run -- --text-file path/to/post.txt
```

Requires `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_AUTHOR_URN` in `.env.local`.

Rebuild semantic editorial memory from confirmed ledger entries:

```bash
npm run social:linkedin:memory:rebuild
```

Collect member post analytics when the token includes `r_member_postAnalytics`:

```bash
npm run social:linkedin:performance:collect
```

The analytics app uses only `LINKEDIN_ANALYTICS_CLIENT_ID`, `LINKEDIN_ANALYTICS_CLIENT_SECRET`, and `LINKEDIN_ANALYTICS_ACCESS_TOKEN`. After LinkedIn approves the analytics permission, generate its isolated token with:

```bash
npm run social:linkedin:analytics:oauth
```

Without that scope, record metrics copied from LinkedIn manually:

```bash
npm run social:linkedin:performance:record -- --slug my-post --impressions 1000 --profile-views 8 --saves 4 --sends 2 --followers-gained 1
```

Performance scoring emphasizes profile views, follower gains, saves, sends, and link clicks over reactions or raw impressions.
