# Social automation data

Runtime state for LinkedIn publishing scripts. These files are **gitignored** to avoid committing operational data to a public repository.

## Setup

Copy the example templates to their runtime filenames:

```powershell
Copy-Item data/social/linkedin-post-queue.example.json data/social/linkedin-post-queue.json
Copy-Item data/social/linkedin-blog-post-ledger.example.json data/social/linkedin-blog-post-ledger.json
Copy-Item data/social/linkedin-performance-feedback.example.json data/social/linkedin-performance-feedback.json
Copy-Item data/social/linkedin-editorial-memory.example.json data/social/linkedin-editorial-memory.json
```

See [scripts/README.md](../../scripts/README.md) for LinkedIn automation commands.
