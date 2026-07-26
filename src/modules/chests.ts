export function rpcChestAction(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) throw Error("Requires authentication.");

    let args = JSON.parse(payload);
    let slotIndex = args.slotIndex;
    let action = args.action; // "start_unlock" | "open" | "skip_ads"

    let objects = nk.storageRead([{ collection: "daily_state", key: "chests", userId: ctx.userId }]);
    let chestsState: any = { slots: [{}, {}, {}, {}] };
    if (objects.length > 0) chestsState = objects[0].value;

    let slot = chestsState.slots[slotIndex];
    if (!slot || slot.isEmpty) throw Error("Slot is empty.");

    let now = Date.now();

    if (action === "start_unlock") {
        if (slot.isUnlocking) throw Error("Already unlocking.");
        slot.isUnlocking = true;
        slot.unlockStartTime = now;
        
        // Ensure only one chest unlocks at a time
        for (let i = 0; i < 4; i++) {
            if (i !== slotIndex && chestsState.slots[i].isUnlocking) {
                throw Error("Another chest is already unlocking.");
            }
        }
    } 
    else if (action === "skip_ads") {
        if (!slot.isUnlocking) throw Error("Not unlocking.");
        slot.durationMs = 0; // Instantly finish
    }
    else if (action === "open") {
        if (!slot.isUnlocking) throw Error("Not unlocking.");
        if (now - slot.unlockStartTime < slot.durationMs) {
            throw Error("Chest is not ready yet.");
        }
        
        // Random drops (Server-side RNG)
        let goldReward = Math.floor(Math.random() * 500) + 100;
        let cardReward = "Turret_Archer"; // TODO: random from available pool
        let shardsReward = Math.floor(Math.random() * 10) + 1;

        nk.walletUpdate(ctx.userId, { coins: goldReward }, { "source": "chest_open" }, true);
        
        // Update Inventory
        let invObjects = nk.storageRead([{ collection: "inventory", key: "cards", userId: ctx.userId }]);
        let cards: any = {};
        if (invObjects.length > 0) cards = invObjects[0].value;
        
        if (!cards[cardReward]) cards[cardReward] = { shards: 0, level: 1, isUnlocked: true };
        cards[cardReward].shards += shardsReward;
        
        nk.storageWrite([{ collection: "inventory", key: "cards", userId: ctx.userId, value: cards }]);

        // Clear slot
        chestsState.slots[slotIndex] = { isEmpty: true };

        nk.storageWrite([{ collection: "daily_state", key: "chests", userId: ctx.userId, value: chestsState }]);

        return JSON.stringify({ success: true, coins: goldReward, cardId: cardReward, shards: shardsReward });
    }

    nk.storageWrite([{ collection: "daily_state", key: "chests", userId: ctx.userId, value: chestsState }]);
    return JSON.stringify({ success: true });
}
