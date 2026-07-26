# Database Schema

Nakama uses an internal PostgreSQL engine to store core authentication mapping (Users, Accounts, Wallets).
For our custom game data, we utilize the Nakama **Storage Engine**.

## 1. Native Wallet (`wallet`)
Nakama tracks two primary currencies natively:
- `"coins"`: Soft currency (Gold)
- `"gems"`: Hard currency (Diamonds)

## 2. Profile Collection (`profile`)

### Key: `stats`
- `accountLevel` (int): Player's main level
- `exp` (int): Current experience points
- `currentStage` (int): Max stage unlocked in Campaign
- `totalStars` (int): Total stars earned in Campaign

### Key: `energy`
- `energy` (int): Current energy amount (Max 100)
- `lastEnergyUpdateTime` (long): Timestamp (MS) of last regeneration calculation.

## 3. Inventory Collection (`inventory`)

### Key: `cards`
A JSON Dictionary mapping `cardId` (string) to its progress state:
```json
{
  "Turret_Archer": {
    "shards": 10,
    "level": 1,
    "isUnlocked": true
  }
}
```

### Key: `deck`
Tracks the actively equipped towers/blocks in battle.
```json
{
  "equipped": ["Turret_Archer", "Turret_Mage", "Block_Wood"]
}
```

## 4. Daily State Collection (`daily_state`)

### Key: `login`
- `lastLoginDate` (string): e.g. "2026-07-27"
- `consecutiveLoginDays` (int): Streak count
- `hasClaimedDailyReward` (bool): True if collected today

### Key: `chests`
Contains an array `slots` of size 4.
```json
{
  "slots": [
    {
      "isEmpty": false,
      "chestId": "chest_common",
      "isUnlocking": true,
      "startUnlockTime": 1713400000000,
      "unlockDurationSeconds": 3600
    },
    { "isEmpty": true },
    { "isEmpty": true },
    { "isEmpty": true }
  ]
}
```

### Key: `quests`
- `dailyEnemiesKilled` (int): Kill counter
- `dailyTurretsUpgraded` (int): Upgrade counter
- `hasClaimedQuest1` (bool)
- `hasClaimedQuest2` (bool)
