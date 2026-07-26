function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    logger.info("TowerDefend Nakama Module Loaded.");

    initializer.registerRpc("rpc_gacha_roll", rpcGachaRoll);
    initializer.registerRpc("rpc_tech_unlock", rpcTechUnlock);
    initializer.registerRpc("rpc_deck_equip", rpcDeckEquip);
    initializer.registerRpc("rpc_match_start", rpcMatchStart);
    initializer.registerRpc("rpc_match_end", rpcMatchEnd);

    initializer.registerAfterAuthenticateDevice(afterAuthenticateDevice);
}

// --------------------------------------------------------
// HOOKS
// --------------------------------------------------------

function afterAuthenticateDevice(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.Session, request: nkruntime.AuthenticateDeviceRequest) {
    // Tự động khởi tạo dữ liệu tân thủ nếu là tài khoản mới
    if (data.created) {
        let initialProfile = {
            accountLevel: 1,
            exp: 0,
            coins: 500,
            gems: 100,
            energy: 100,
            lastEnergyUpdateTime: Date.now(),
            totalStars: 0,
            unlockedTechNodes: [],
            equippedCards: ["Turret_Basic", "Turret_Laser", "Block_Basic", "Block_Economy"],
            cardProgresses: [
                { cardId: "Turret_Basic", shards: 0, level: 1, isUnlocked: true },
                { cardId: "Turret_Laser", shards: 0, level: 1, isUnlocked: true },
                { cardId: "Block_Basic", shards: 0, level: 1, isUnlocked: true },
                { cardId: "Block_Economy", shards: 0, level: 1, isUnlocked: true }
            ]
        };

        nk.storageWrite([
            {
                collection: "Profile",
                key: "MetaSaveData",
                userId: ctx.userId,
                value: initialProfile,
                permissionRead: 1,
                permissionWrite: 0 // Client không được ghi đè, chỉ đọc
            }
        ]);
        logger.info(`Đã khởi tạo dữ liệu tân thủ cho User: ${ctx.userId}`);
    }
}

// --------------------------------------------------------
// RPCs
// --------------------------------------------------------

function rpcGachaRoll(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) throw Error("Yêu cầu đăng nhập.");
    
    // Đọc data từ storage
    let objects = nk.storageRead([{ collection: "Profile", key: "MetaSaveData", userId: ctx.userId }]);
    if (objects.length === 0) throw Error("Không tìm thấy dữ liệu Profile.");

    let profile = objects[0].value;
    let cost = 100; // 100 gems cho 1 roll

    if (profile.gems < cost) {
        throw Error("Không đủ Kim Cương.");
    }

    // Trừ tiền
    profile.gems -= cost;

    // TODO: Bốc thăm ngẫu nhiên thẻ (Server-side logic để chống hack)
    let wonCardId = "Turret_Sniper"; 
    let wonShards = 10;

    // Cập nhật Inventory
    let found = false;
    for (let c of profile.cardProgresses) {
        if (c.cardId === wonCardId) {
            c.shards += wonShards;
            if (c.shards >= 10 && !c.isUnlocked) c.isUnlocked = true;
            found = true;
            break;
        }
    }
    if (!found) {
        profile.cardProgresses.push({ cardId: wonCardId, shards: wonShards, level: 1, isUnlocked: true });
    }

    // Lưu lại
    nk.storageWrite([
        {
            collection: "Profile",
            key: "MetaSaveData",
            userId: ctx.userId,
            value: profile,
            version: objects[0].version
        }
    ]);

    return JSON.stringify({
        success: true,
        rewardId: wonCardId,
        rewardShards: wonShards,
        remainingGems: profile.gems
    });
}

function rpcTechUnlock(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) throw Error("Yêu cầu đăng nhập.");
    let args = JSON.parse(payload);
    let nodeId = args.nodeId;
    let cost = args.cost; // Trong thực tế, Server nên tự check cost từ config để chống hack

    let objects = nk.storageRead([{ collection: "Profile", key: "MetaSaveData", userId: ctx.userId }]);
    let profile = objects[0].value;

    if (profile.totalStars < cost) throw Error("Không đủ Sao.");
    if (profile.unlockedTechNodes.indexOf(nodeId) !== -1) throw Error("Kỹ năng đã được mở khóa.");

    profile.totalStars -= cost;
    profile.unlockedTechNodes.push(nodeId);

    nk.storageWrite([{ collection: "Profile", key: "MetaSaveData", userId: ctx.userId, value: profile, version: objects[0].version }]);
    return JSON.stringify({ success: true, remainingStars: profile.totalStars });
}

function rpcDeckEquip(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) throw Error("Yêu cầu đăng nhập.");
    let args = JSON.parse(payload);
    let newDeck = args.equippedCards; // Array of string

    if (newDeck.length > 8) throw Error("Deck vượt quá 8 thẻ.");

    let objects = nk.storageRead([{ collection: "Profile", key: "MetaSaveData", userId: ctx.userId }]);
    let profile = objects[0].value;

    // Validate if user actually owns these cards
    for (let cId of newDeck) {
        let owns = profile.cardProgresses.some((p: any) => p.cardId === cId && p.isUnlocked);
        if (!owns) throw Error("Cố tình trang bị thẻ chưa sở hữu: " + cId);
    }

    profile.equippedCards = newDeck;

    nk.storageWrite([{ collection: "Profile", key: "MetaSaveData", userId: ctx.userId, value: profile, version: objects[0].version }]);
    return JSON.stringify({ success: true });
}

function rpcMatchStart(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) throw Error("Yêu cầu đăng nhập.");
    let args = JSON.parse(payload);
    let cost = args.energyCost || 10;

    let objects = nk.storageRead([{ collection: "Profile", key: "MetaSaveData", userId: ctx.userId }]);
    let profile = objects[0].value;

    if (profile.energy < cost) throw Error("Không đủ thể lực.");
    
    profile.energy -= cost;
    profile.lastEnergyUpdateTime = Date.now(); // Reset timer if full

    nk.storageWrite([{ collection: "Profile", key: "MetaSaveData", userId: ctx.userId, value: profile, version: objects[0].version }]);
    return JSON.stringify({ success: true, remainingEnergy: profile.energy });
}

function rpcMatchEnd(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) throw Error("Yêu cầu đăng nhập.");
    let args = JSON.parse(payload);
    
    let isWin = args.isWin;
    let earnedGold = args.earnedGold;
    let earnedStars = args.earnedStars;

    // TODO: Add Anti-Cheat validation here (e.g., limit max gold per match to 5000)
    if (earnedGold > 10000) throw Error("Phát hiện nghi vấn Hack Vàng.");

    let objects = nk.storageRead([{ collection: "Profile", key: "MetaSaveData", userId: ctx.userId }]);
    let profile = objects[0].value;

    profile.coins += earnedGold;
    profile.totalStars += earnedStars;
    if (isWin && args.stageIdx > profile.currentStage) {
        profile.currentStage = args.stageIdx;
    }

    nk.storageWrite([{ collection: "Profile", key: "MetaSaveData", userId: ctx.userId, value: profile, version: objects[0].version }]);
    return JSON.stringify({ success: true, coins: profile.coins, stars: profile.totalStars });
}
