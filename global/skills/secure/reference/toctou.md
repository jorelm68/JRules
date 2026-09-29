# TOCTOU (time-of-check to time-of-use)

**The bug:** the code checks a condition (permission, existence, balance, "not used yet"), then acts on it in a
separate step. An attacker changes the world in the gap — swaps a file for a symlink, fires 50 parallel requests —
and the act runs on something the check never approved. Retrying in a loop makes winning the race easy.

**The fix, always:** make the check and the act **one atomic operation**, and keep a reference to what was checked
(a file descriptor, a locked row), never re-resolve by name.

## Files
```js
// ❌ check, then act by path — the path can be swapped in between
if (canWrite(path)) await fs.appendFile(path, line);          // or fs.access(path, W_OK) then write

// ✅ attempt the open itself; failure = no permission. Then use only the handle.
import { open, constants as C } from "node:fs/promises";
const fh = await open(path, C.O_WRONLY | C.O_APPEND | (C.O_NOFOLLOW ?? 0)); // throws EACCES/ELOOP → deny
try {
  const st = await fh.stat();              // inspect the opened file, not the path
  if (!st.isFile()) throw new Error("not a regular file");
  await fh.appendFile(line);               // writes go to the file we opened, even if the path is swapped now
} finally { await fh.close(); }
```
- Create-if-missing: `open(path, "wx")` (fails if it exists) instead of `exists()` then create.
- `O_NOFOLLOW` refuses a symlink at the final component (POSIX; absent on Windows, where the `?? 0` makes it a
  no-op). Permission-by-open only works when the process runs with the user's OS permissions. In a web app the
  server runs as one account, so: never build paths from user input — map IDs to paths yourself, resolve with
  `path.resolve` and confirm the result stays inside the allowed base dir, and prefer object storage (§Uploads).

## Databases (the common web-app form)
Parallel requests are the "attacker retrying". Push the condition into the write:
```sql
-- ❌ select credits; if credits >= 1 then update ... (two requests both see 1, both spend it)
-- ✅ conditional update — 0 rows returned = denied
update accounts set credits = credits - 1 where id = $1 and credits >= 1 returning credits;

-- ✅ one-time things (coupon, invite, webhook event, free trial): unique constraint + insert first
insert into redemptions (user_id, coupon_id) values ($1, $2) on conflict do nothing returning id;

-- ✅ multi-step logic: one transaction, lock the row you checked
begin; select ... from orders where id = $1 for update; ...; commit;

-- ✅ edits from stale screens: optimistic concurrency
update docs set body = $2, version = version + 1 where id = $1 and version = $3;
```
- Supabase: put multi-step logic in a Postgres function called via `rpc` (one transaction), not several
  client calls. RLS still applies inside unless the function is `security definer`.
- Payment/credit/AI-quota endpoints also need an idempotency key so client retries don't double-apply.
