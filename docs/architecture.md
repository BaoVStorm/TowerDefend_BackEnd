# System Architecture

## Overview
TowerDefend utilizes a Server-Authoritative Architecture using [Nakama](https://heroiclabs.com/). 
The Unity Client acts as a visual renderer and input gatherer, while the TypeScript Backend dictates game economy, rewards, and inventory logic.

## Client-Server Interaction
1. **Authentication**: Unity connects to Nakama via Device ID, Email, Google, or Apple Auth.
2. **Data Initialization**: When a user logs in for the first time, Nakama's server-side Hooks (`afterAuthenticate`) create their starting profile in the Storage Engine.
3. **Data Fetching**: Unity fetches its state (Profile, Cards, Deck, Chests, Quests, Energy) in a single batched call via `CloudSaveManager`.
4. **Mutations via RPC**: The Unity client **never** modifies save data locally. All mutations (upgrading a card, spending coins, claiming a chest) happen via Remote Procedure Calls (RPCs). The RPC updates the Nakama Storage and Wallet, then returns success/failure to Unity.

## Backend Modules
- `economy.ts`: Daily login streaks, daily rewards, energy regeneration, and virtual wallet (coins/gems) tracking.
- `inventory.ts`: Managing unlocked cards, card shards, level upgrades, and equipped battle decks.
- `chests.ts`: Managing chest slot assignment, time-based unlocking securely mapped to UTC server time, and ad-skips.
- `battle.ts`: Tracking quest progress and calculating end-of-match rewards (gold drops, chest drops) to prevent client-side spoofing.
