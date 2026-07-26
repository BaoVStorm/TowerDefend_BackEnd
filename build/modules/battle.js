"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpcUpdateQuestProgress = rpcUpdateQuestProgress;
exports.rpcClaimQuest = rpcClaimQuest;
exports.rpcBattleEnd = rpcBattleEnd;
function rpcUpdateQuestProgress(ctx, logger, nk, payload) {
    if (!ctx.userId)
        throw Error("Requires authentication.");
    let args = JSON.parse(payload);
    let enemiesKilled = args.enemiesKilled || 0;
    let turretsUpgraded = args.turretsUpgraded || 0;
    let objects = nk.storageRead([{ collection: "daily_state", key: "quests", userId: ctx.userId }]);
    let questState = { dailyEnemiesKilled: 0, dailyTurretsUpgraded: 0, hasClaimedQuest1: false, hasClaimedQuest2: false };
    if (objects.length > 0)
        questState = objects[0].value;
    questState.dailyEnemiesKilled += enemiesKilled;
    questState.dailyTurretsUpgraded += turretsUpgraded;
    nk.storageWrite([{ collection: "daily_state", key: "quests", userId: ctx.userId, value: questState }]);
    return JSON.stringify({ success: true });
}
function rpcClaimQuest(ctx, logger, nk, payload) {
    if (!ctx.userId)
        throw Error("Requires authentication.");
    let args = JSON.parse(payload);
    let questId = args.questId;
    let objects = nk.storageRead([{ collection: "daily_state", key: "quests", userId: ctx.userId }]);
    let questState = { dailyEnemiesKilled: 0, dailyTurretsUpgraded: 0, hasClaimedQuest1: false, hasClaimedQuest2: false };
    if (objects.length > 0)
        questState = objects[0].value;
    let coinsReward = 0;
    if (questId === 1 && questState.dailyEnemiesKilled >= 100 && !questState.hasClaimedQuest1) {
        questState.hasClaimedQuest1 = true;
        coinsReward = 500;
    }
    else if (questId === 2 && questState.dailyTurretsUpgraded >= 20 && !questState.hasClaimedQuest2) {
        questState.hasClaimedQuest2 = true;
        coinsReward = 500;
    }
    else {
        throw Error("Quest not completed or already claimed.");
    }
    nk.walletUpdate(ctx.userId, { coins: coinsReward }, { "source": "quest_claim" }, true);
    nk.storageWrite([{ collection: "daily_state", key: "quests", userId: ctx.userId, value: questState }]);
    return JSON.stringify({ success: true, coins: coinsReward });
}
function rpcBattleEnd(ctx, logger, nk, payload) {
    if (!ctx.userId)
        throw Error("Requires authentication.");
    let args = JSON.parse(payload);
    let wavesCleared = args.wavesCleared || 0;
    let isWin = args.isWin || false;
    // Validate anti-cheat (max waves possible ~50)
    if (wavesCleared > 100)
        throw Error("Suspicious wave count.");
    let earnedGold = wavesCleared * 10;
    let earnedStars = isWin ? 3 : 1;
    // Add gold to wallet
    nk.walletUpdate(ctx.userId, { coins: earnedGold }, { "source": "battle_end" }, true);
    // Update Profile
    let objects = nk.storageRead([{ collection: "profile", key: "stats", userId: ctx.userId }]);
    let stats = { totalStars: 0, currentStage: 1 };
    if (objects.length > 0)
        stats = objects[0].value;
    stats.totalStars += earnedStars;
    if (isWin && args.stageIdx && args.stageIdx > stats.currentStage) {
        stats.currentStage = args.stageIdx;
    }
    nk.storageWrite([{ collection: "profile", key: "stats", userId: ctx.userId, value: stats }]);
    // Random Chest Drop
    let chestDropped = false;
    let chestSlots = nk.storageRead([{ collection: "daily_state", key: "chests", userId: ctx.userId }]);
    let chestsState = { slots: [{ isEmpty: true }, { isEmpty: true }, { isEmpty: true }, { isEmpty: true }] };
    if (chestSlots.length > 0)
        chestsState = chestSlots[0].value;
    if (Math.random() > 0.5) { // 50% chance drop chest
        for (let i = 0; i < 4; i++) {
            if (chestsState.slots[i].isEmpty) {
                chestsState.slots[i] = {
                    isEmpty: false,
                    chestId: "SilverChest", // Random chest tier
                    isUnlocking: false,
                    unlockStartTime: 0,
                    durationMs: 3 * 60 * 60 * 1000 // 3 hours
                };
                chestDropped = true;
                break;
            }
        }
        if (chestDropped) {
            nk.storageWrite([{ collection: "daily_state", key: "chests", userId: ctx.userId, value: chestsState }]);
        }
    }
    return JSON.stringify({ success: true, coins: earnedGold, stars: earnedStars, chestDropped: chestDropped });
}
