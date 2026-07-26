export function rpcClaimDailyReward(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) throw Error("Requires authentication.");

    let objects = nk.storageRead([{ collection: "daily_state", key: "login", userId: ctx.userId }]);
    let dailyState: any = { lastLoginDate: "", consecutiveLoginDays: 0, hasClaimedDailyReward: false };
    
    if (objects.length > 0) {
        dailyState = objects[0].value;
    }

    if (dailyState.hasClaimedDailyReward) {
        throw Error("Already claimed today.");
    }

    // Give rewards based on consecutiveLoginDays (simplified)
    let coinsReward = 100 + (dailyState.consecutiveLoginDays * 10);
    nk.walletUpdate(ctx.userId, { coins: coinsReward }, { "source": "daily_reward" }, true);

    dailyState.hasClaimedDailyReward = true;
    nk.storageWrite([{ collection: "daily_state", key: "login", userId: ctx.userId, value: dailyState }]);

    return JSON.stringify({ success: true, coins: coinsReward });
}

export function rpcSyncEnergy(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) throw Error("Requires authentication.");

    // Energy max is 100, regenerates 1 per 5 minutes
    let objects = nk.storageRead([{ collection: "profile", key: "energy", userId: ctx.userId }]);
    let energyState: any = { energy: 100, lastEnergyUpdateTime: Date.now() };

    if (objects.length > 0) {
        energyState = objects[0].value;
    }

    let now = Date.now();
    let elapsedMs = now - energyState.lastEnergyUpdateTime;
    let regenAmount = Math.floor(elapsedMs / (5 * 60 * 1000));

    if (regenAmount > 0 && energyState.energy < 100) {
        energyState.energy = Math.min(100, energyState.energy + regenAmount);
        // Only update time for the amount regenerated
        energyState.lastEnergyUpdateTime += regenAmount * (5 * 60 * 1000);
        
        nk.storageWrite([{ collection: "profile", key: "energy", userId: ctx.userId, value: energyState }]);
    }

    return JSON.stringify({ success: true, energy: energyState.energy, lastUpdate: energyState.lastEnergyUpdateTime });
}
