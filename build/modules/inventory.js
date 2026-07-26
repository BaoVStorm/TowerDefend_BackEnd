"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpcUpgradeCard = rpcUpgradeCard;
exports.rpcEquipDeck = rpcEquipDeck;
function rpcUpgradeCard(ctx, logger, nk, payload) {
    if (!ctx.userId)
        throw Error("Requires authentication.");
    let args = JSON.parse(payload);
    let cardId = args.cardId;
    let costCoins = args.costCoins;
    let costShards = args.costShards;
    // Check Wallet
    let account = nk.accountGetId(ctx.userId);
    let wallet = typeof account.wallet === 'string' ? JSON.parse(account.wallet) : (account.wallet || { coins: 0 });
    if (wallet.coins < costCoins) {
        throw Error("Not enough coins.");
    }
    // Check Inventory
    let objects = nk.storageRead([{ collection: "inventory", key: "cards", userId: ctx.userId }]);
    let cards = {};
    if (objects.length > 0)
        cards = objects[0].value;
    if (!cards[cardId] || cards[cardId].shards < costShards) {
        throw Error("Not enough shards.");
    }
    // Deduct coins
    nk.walletUpdate(ctx.userId, { coins: -costCoins }, { "source": "upgrade_card", "cardId": cardId }, true);
    // Update Card
    cards[cardId].shards -= costShards;
    cards[cardId].level = (cards[cardId].level || 1) + 1;
    nk.storageWrite([{ collection: "inventory", key: "cards", userId: ctx.userId, value: cards }]);
    return JSON.stringify({ success: true, newLevel: cards[cardId].level, remainingShards: cards[cardId].shards });
}
function rpcEquipDeck(ctx, logger, nk, payload) {
    if (!ctx.userId)
        throw Error("Requires authentication.");
    let args = JSON.parse(payload);
    let deck = args.deck; // string[]
    if (!Array.isArray(deck) || deck.length > 8) {
        throw Error("Invalid deck size.");
    }
    let objects = nk.storageRead([{ collection: "inventory", key: "cards", userId: ctx.userId }]);
    let cards = {};
    if (objects.length > 0)
        cards = objects[0].value;
    for (let c of deck) {
        if (!cards[c] || !cards[c].isUnlocked) {
            throw Error("Equipping unowned card: " + c);
        }
    }
    nk.storageWrite([{ collection: "inventory", key: "deck", userId: ctx.userId, value: { equipped: deck } }]);
    return JSON.stringify({ success: true });
}
