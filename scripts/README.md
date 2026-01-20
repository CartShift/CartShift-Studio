# Development Scripts

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

For normal development (when no other instances are running), use:

```bash
pnpm run dev
```
