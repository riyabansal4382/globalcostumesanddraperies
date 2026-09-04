# Tighten fuzzy search so "line" only shows real matches

## Why those 3 extra skirts appear

Searching "line" returns 5 costumes: the 2 real ones (Skirt Black Line, Skirt Black Line2) plus 3 others (Skirt Black Net With Golden Border, Skirt Black With Golden Lace, Skirt Black With Golden LAce2).

The cause is the loosest fallback in the fuzzy search (`src/lib/search.ts`): after exact and typo checks fail, it accepts a match if the letters of the search word appear **anywhere in order** inside the costume name. "line" is l → i → n → e, and long names like "skirt black with go**l**den… w**i**th… golde**n**… lac**e**" contain those four letters in order, so they pass with a low-but-nonzero score (25). Any result scoring above zero is shown, so these weak coincidental matches appear alongside the real ones.

## The fix

In `src/lib/search.ts`:

1. **Remove the letters-in-order (subsequence) fallback** from `scoreField` — it produces false positives for short common words like "line", "red", "net".
2. **Keep the genuine typo tolerance** (edit-distance check), so "sari" still finds "Saree" and "anarka" still finds "Angarakha" — that part works well and stays.
3. **Keep all other behaviour unchanged**: 300ms debounce, suggestions dropdown, filters, ranking (exact word matches still outrank typo matches automatically by score).

## Result after the change

- "line" → only Skirt Black Line and Skirt Black Line2 (and any future costume whose name, collection, colour or tag actually contains "line" or is one typo away).
- Genuine typo searches keep working as before.
- No change to the admin panel, collections, or the database.

## Verification

- Re-run the live search for "line" and confirm only the 2 real results show.
- Spot-check "sari" → Saree results and "anarka" → Angarakha results still work.
- Run the production build.
