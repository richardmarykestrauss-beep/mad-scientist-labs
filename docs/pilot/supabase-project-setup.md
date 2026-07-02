# Supabase pilot project setup

Complete this configuration before creating Warren or any client accounts. Do not place credentials, keys, tokens, or passwords in this document.

## Authentication

- Keep the application sign-in only. There is no public signup or role selector in the pilot UI.
- In Supabase Authentication settings, disable open public signup when the selected Auth configuration supports it.
- Create or invite every synthetic tester, Warren, and each approved client through the project-owner/admin workflow.
- Confirm the email provider, invite template, site URL, and allowed redirect URLs point only to approved pilot hosts.
- Confirm each invited user receives a `client` profile. Promote Warren only with the privileged administrator SQL template.

## Data API and secrets

- Expose only the schemas required by the Data API. Confirm `private` is not listed as an exposed API schema.
- Configure the browser with the project URL and publishable key only.
- Never put a secret/service-role key, database password, or access token in a `VITE_` variable.
- Set `VITE_DATA_MODE=supabase` explicitly. Missing or unknown modes fail closed.

## Required gates

1. Apply the R3 foundation migration and the R3.1 hardening migration as applicable.
2. Run `supabase-verification.sql` and retain the non-secret results.
3. Complete every row in `three-account-proof.md` with synthetic accounts.
4. Do not create Warren or the ten real client accounts until the three-account proof passes.
