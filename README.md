# KasWare Wallet

KasWare Wallet - the first open-source browser extension wallet for Kaspa.

- Website: https://kasware.xyz/
- Twitter: https://twitter.com/kasware_wallet

## How to build

- Install [Node.js](https://nodejs.org) version 18
- Install [pnpm]
- Install dependencies: `pnpm install`
- Build the project to the `./dist/` folder with `pnpm run build:firefox` for Firefox
- Build the project to the `./dist/` folder with `pnpm run build:chrome` for Chrome
- Develop: `pnpm run build:chrome:dev`

## Special Thanks

Thanks to the MetaMask team and Unisat team for their contributions to the browser extension wallet community, KasWare Wallet relies heavily on their contributions.

Wallet feature is powered by kaspa-wasm module developed by kaspa core team. And the default RPC services utilized by Kasware Wallet are expertly maintained by the Aspectron team, the masterminds behind the KDX Wallet, Kaspanet Web Wallet, and the Kaspa-NG project.