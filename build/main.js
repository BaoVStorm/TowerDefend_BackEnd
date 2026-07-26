"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const economy_1 = require("./modules/economy");
const inventory_1 = require("./modules/inventory");
const chests_1 = require("./modules/chests");
const battle_1 = require("./modules/battle");
let InitModule = function (ctx, logger, nk, initializer) {
    logger.info("Nakama Module Init!");
    // Đăng ký Hook chạy sau khi người dùng đăng nhập bằng DeviceID
    initializer.registerAfterAuthenticateDevice(afterAuthenticateDevice);
    // Economy
    initializer.registerRpc("rpc_claim_daily_reward", economy_1.rpcClaimDailyReward);
    initializer.registerRpc("rpc_sync_energy", economy_1.rpcSyncEnergy);
    // Inventory
    initializer.registerRpc("rpc_upgrade_card", inventory_1.rpcUpgradeCard);
    initializer.registerRpc("rpc_equip_deck", inventory_1.rpcEquipDeck);
    // Chests
    initializer.registerRpc("rpc_chest_action", chests_1.rpcChestAction);
    // Battle
    initializer.registerRpc("rpc_update_quest_progress", battle_1.rpcUpdateQuestProgress);
    initializer.registerRpc("rpc_claim_quest", battle_1.rpcClaimQuest);
    initializer.registerRpc("rpc_battle_end", battle_1.rpcBattleEnd);
};
function afterAuthenticateDevice(ctx, logger, nk, data, request) {
    if (!ctx.userId)
        return;
    let objects = nk.storageRead([{ collection: "profile", key: "stats", userId: ctx.userId }]);
    if (objects.length === 0) {
        logger.info("Khởi tạo dữ liệu người chơi mới cho UserID: " + ctx.userId);
        // Khởi tạo Ví (Wallet)
        nk.walletUpdate(ctx.userId, { coins: 1000, gems: 100 }, { "source": "initial_bonus" }, true);
        // Khởi tạo Profile
        let stats = {
            accountLevel: 1,
            exp: 0,
            currentStage: 1,
            totalStars: 0
        };
        nk.storageWrite([{ collection: "profile", key: "stats", userId: ctx.userId, value: stats }]);
        // Khởi tạo Energy
        let energyState = { energy: 100, lastEnergyUpdateTime: Date.now() };
        nk.storageWrite([{ collection: "profile", key: "energy", userId: ctx.userId, value: energyState }]);
        // Khởi tạo Inventory (Cards)
        let cards = {};
        cards["Turret_Archer"] = { shards: 10, level: 1, isUnlocked: true };
        nk.storageWrite([{ collection: "inventory", key: "cards", userId: ctx.userId, value: cards }]);
        // Khởi tạo Deck
        let deck = { equipped: ["Turret_Archer"] };
        nk.storageWrite([{ collection: "inventory", key: "deck", userId: ctx.userId, value: deck }]);
        // Khởi tạo Chests
        let chests = { slots: [{ isEmpty: true }, { isEmpty: true }, { isEmpty: true }, { isEmpty: true }] };
        nk.storageWrite([{ collection: "daily_state", key: "chests", userId: ctx.userId, value: chests }]);
        // Khởi tạo Quests & Login
        let quests = { dailyEnemiesKilled: 0, dailyTurretsUpgraded: 0, hasClaimedQuest1: false, hasClaimedQuest2: false };
        nk.storageWrite([{ collection: "daily_state", key: "quests", userId: ctx.userId, value: quests }]);
        let login = { lastLoginDate: "", consecutiveLoginDays: 0, hasClaimedDailyReward: false };
        nk.storageWrite([{ collection: "daily_state", key: "login", userId: ctx.userId, value: login }]);
    }
}
