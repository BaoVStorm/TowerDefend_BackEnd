import { rpcClaimDailyReward, rpcSyncLogin, rpcSyncEnergy } from "./modules/economy";
import { rpcUpgradeCard, rpcEquipDeck } from "./modules/inventory";
import { rpcChestAction } from "./modules/chests";
import { rpcUpdateQuestProgress, rpcClaimQuest, rpcBattleEnd, rpcMatchStart } from "./modules/battle";

let InitModule: nkruntime.InitModule = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    logger.info("Nakama Module Init!");

    // Đăng ký Hooks cho tất cả các phương thức đăng nhập
    initializer.registerAfterAuthenticateDevice(afterAuthenticate);
    initializer.registerAfterAuthenticateEmail(afterAuthenticate);
    initializer.registerAfterAuthenticateGoogle(afterAuthenticate);
    initializer.registerAfterAuthenticateApple(afterAuthenticate);

    // Economy
    initializer.registerRpc("rpc_claim_daily_reward", rpcClaimDailyReward);
    initializer.registerRpc("rpc_sync_login", rpcSyncLogin);
    initializer.registerRpc("rpc_sync_energy", rpcSyncEnergy);

    // Inventory
    initializer.registerRpc("rpc_upgrade_card", rpcUpgradeCard);
    initializer.registerRpc("rpc_equip_deck", rpcEquipDeck);

    // Chests
    initializer.registerRpc("rpc_chest_action", rpcChestAction);

    // Battle
    initializer.registerRpc("rpc_update_quest_progress", rpcUpdateQuestProgress);
    initializer.registerRpc("rpc_claim_quest", rpcClaimQuest);
    initializer.registerRpc("rpc_battle_end", rpcBattleEnd);
    initializer.registerRpc("rpc_match_start", rpcMatchStart);
}

function afterAuthenticate(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.Session, request: any) {
    if (!ctx.userId) return;

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
        let cards: any = {};
        cards["Turret_Archer"] = { shards: 10, level: 1, isUnlocked: true };
        nk.storageWrite([{ collection: "inventory", key: "cards", userId: ctx.userId, value: cards }]);

        // Khởi tạo Deck
        let deck = { equipped: ["Turret_Archer"] };
        nk.storageWrite([{ collection: "inventory", key: "deck", userId: ctx.userId, value: deck }]);

        // Khởi tạo Chests
        let chests = { slots: [{isEmpty:true}, {isEmpty:true}, {isEmpty:true}, {isEmpty:true}] };
        nk.storageWrite([{ collection: "daily_state", key: "chests", userId: ctx.userId, value: chests }]);

        // Khởi tạo Quests & Login
        let quests = { dailyEnemiesKilled: 0, dailyTurretsUpgraded: 0, hasClaimedQuest1: false, hasClaimedQuest2: false };
        nk.storageWrite([{ collection: "daily_state", key: "quests", userId: ctx.userId, value: quests }]);

        let login = { lastLoginDate: "", consecutiveLoginDays: 0, hasClaimedDailyReward: false };
        nk.storageWrite([{ collection: "daily_state", key: "login", userId: ctx.userId, value: login }]);
    }
}
