

## Bug Found: Vehicle cards grid shows "No vehicles found" despite data being fetched

### Root Cause

There is a race condition in `useVehicleSearch.ts` between the debounce timer and two competing `useEffect` hooks:

**Timeline:**
1. Component mounts: `filters = A`, `debouncedFilters = A` (same object reference)
2. React Query fetches data `D` with query key `[A]`
3. **Accumulation effect** `[data, page]` runs: sets `allVehicles = D.vehicles` -- cards appear briefly
4. **300ms later**: `useDebounce` fires `setDebouncedValue(filters)` -- creates a new object reference `A'` (same value, different ref)
5. **Reset effect** `[debouncedFilters, sortBy]` runs (because `A' !== A` by reference): sets `allVehicles = []`, `page = 0`
6. React Query sees query key `[A']` is equivalent to `[A]` (it uses deep JSON comparison): `data` reference stays the same `D`
7. **Accumulation effect** does NOT re-run (because `[D, 0]` hasn't changed)
8. **Result: `allVehicles` stays empty permanently**

### Fix

In `useVehicleSearch.ts`, change the reset effect to use a serialized string dependency instead of the object reference, so it only fires when the filter values actually change:

```ts
// Replace:
useEffect(() => {
    setPage(0);
    setAllVehicles([]);
}, [debouncedFilters, sortBy]);

// With:
const debouncedFiltersKey = JSON.stringify(debouncedFilters);
useEffect(() => {
    setPage(0);
    setAllVehicles([]);
}, [debouncedFiltersKey, sortBy]);
```

This ensures the reset only triggers when filter values truly change, not just on object reference changes from the debounce timer.

### Files to modify
- `src/features/listings/hooks/useVehicleSearch.ts` -- single line change in the reset effect dependency

