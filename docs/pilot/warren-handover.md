# Warren pilot handover

Login URL: `<PILOT_LOGIN_URL>`

## Coach login and review

1. Open the login URL and use Warren's individual account. There is no role selector.
2. Open **Clients**. This live roster contains only active clients assigned to Warren.
3. Open a client and select **Check-ins**. A card marked **Needs Review** is new.
4. Expand it, enter actionable feedback, and choose **Complete Review**. R3 feedback is insert-once and cannot be edited or deleted in the app.
5. Sign out with the icon beside Warren's pilot profile when finished.

## Client invitations

1. A project administrator invites each client through Supabase Authentication using the client's individual email. Never share accounts.
2. The signup trigger creates an active `client` profile; signup metadata cannot create a coach.
3. The administrator adds the active Warren-to-client assignment with the approved SQL template.
4. The client opens the same login URL, signs in, and reaches `/client` automatically from their database role.

## Live and prototype scope

| Area | Pilot status |
|---|---|
| Authentication, role, active status | Live Supabase |
| Warren's assigned-client roster | Live Supabase |
| Weekly client check-in | Live Supabase |
| Coach review and client feedback view | Live Supabase |
| Training and nutrition plans | Disabled for live clients |
| Supplements | Disabled for live clients |
| Labs and biomarkers | Disabled for live clients |
| Coach notes, messaging, AI briefing | Disabled for live clients |
| Invitations inside the app | Not connected; use Supabase admin |

This prototype is for coaching and education. Do not use it for diagnosis, treatment, emergencies, medication changes, or other medical decisions.

## Known limitations and support

- One check-in is allowed per client per ISO week and one review per check-in.
- Submitted check-ins and reviews are immutable in R3.
- Non-check-in modules are blocked in Supabase mode and receive no live client identity or client data.
- Report bugs with the user label, time, page, action, and screenshot/error text. Never include passwords, keys, or tokens.

## Deactivate or roll back

- To deactivate a client, first inactivate their active assignments, then set their profile status to `inactive` using the approved admin template.
- Emergency access rollback: inactivate the affected assignment(s) or profile(s), verify the user can no longer reach data, and take the pilot deployment offline if isolation is in doubt.
- Database migration rollback is not automated in R3. Preserve data and involve the project administrator before schema changes.
