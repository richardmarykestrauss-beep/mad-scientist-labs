# Vite/esbuild pilot mitigation

`npm audit` reports one high and one moderate advisory in the Vite 5/esbuild development chain. The available automated fix moves to Vite 8 and is a breaking major upgrade; no compatible Vite 5 update clears the reported advisory.

Until the separate Vite major-upgrade remediation is completed:

- Never expose the Vite development server publicly or bind it to a LAN/WAN interface.
- The repository binds the development server to `127.0.0.1` only.
- Host the pilot from `npm run build` production artifacts behind the approved HTTPS host.
- Do not use `vite --host 0.0.0.0`, `vite --host ::`, port forwarding, or public tunnels.
- Track the Vite 8 migration separately and rerun tests, typecheck, build, lint, and audit before adoption.

This mitigation does not claim the advisory is resolved; it limits exposure during synthetic live testing.
