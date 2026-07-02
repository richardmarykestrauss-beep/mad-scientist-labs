# Three-account live security proof

This is a live Supabase/app gate, not a mocked-test checklist. Record the date, tester, account label, observed result, and exact safe error text. Do not record credentials or tokens.

Project: `mad-scientist-coaching`  
Deployment URL: `<PILOT_LOGIN_URL>`  
Test date: `<YYYY-MM-DD>`

## Initial state

- Warren / Coach A is active and promoted through privileged SQL.
- Client A and Client B are active client profiles.
- Only Client A is assigned to Warren.

## Results

| Actor | Proof | Expected | Actual | Pass |
|---|---|---|---|---|
| Client A | Sign in and reach `/client` | Allowed | Pending | ☐ |
| Client A | Submit own weekly check-in and refresh | Persists | Pending | ☐ |
| Client A | Submit/read Client B by payload or URL | Denied/no rows | Pending | ☐ |
| Client A | Update/delete own submission | Denied | Pending | ☐ |
| Client A | Insert a coach review or open coach route | Denied | Pending | ☐ |
| Client B | Read Client A or manipulate URL | Denied/no rows | Pending | ☐ |
| Client B | Create assignment or promote self | Denied | Pending | ☐ |
| Client B | View own empty/personal state | Allowed | Pending | ☐ |
| Warren | Reach `/coach` and list Client A | Allowed | Pending | ☐ |
| Warren | Read Client A and insert one review | Allowed | Pending | ☐ |
| Warren | Change Client A submission | Denied | Pending | ☐ |
| Warren | Update/delete inserted review | Denied | Pending | ☐ |
| Warren | See or review unassigned Client B | Denied/no rows | Pending | ☐ |
| Signed out | Open protected routes or query tables | Denied | Pending | ☐ |
| Signed out | See prior athlete state | No | Pending | ☐ |

Do not assign Client B—or onboard the remaining eight clients—until every row passes.
