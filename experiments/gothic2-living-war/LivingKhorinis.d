// Original, engine-independent Daedalus rules for a Gothic II NotR prototype.
// No changes to vanilla game instances, assets or globals.
const int Patch_LivingKhorinis_Neutral = 3;
const int Patch_LivingKhorinis_Militia = 1;
const int Patch_LivingKhorinis_Mercenaries = 2;
var int Patch_LivingKhorinis_Day;
var int Patch_LivingKhorinis_Owner;
var int Patch_LivingKhorinis_MilitiaSupply;
var int Patch_LivingKhorinis_MercenarySupply;
var int Patch_LivingKhorinis_Tension;
var int Patch_LivingKhorinis_Truce;
var int Patch_LivingKhorinis_Revision;

func int Patch_LivingKhorinis_Bounded(var int value, var int maximum) {
    if (value < 0) { return 0; };
    if (value > maximum) { return maximum; };
    return value;
};

func void Patch_LivingKhorinis_Begin(var int day) {
    Patch_LivingKhorinis_Day = day;
    Patch_LivingKhorinis_Owner = Patch_LivingKhorinis_Neutral;
    Patch_LivingKhorinis_MilitiaSupply = 5;
    Patch_LivingKhorinis_MercenarySupply = 4;
    Patch_LivingKhorinis_Tension = 0;
    Patch_LivingKhorinis_Truce = 0;
    Patch_LivingKhorinis_Revision = 0;
};

// A party or player can complete one delivery transaction through the future engine adapter.
func void Patch_LivingKhorinis_Deliver(var int side) {
    if (side == Patch_LivingKhorinis_Militia) {
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply + 2, 10);
    };
    if (side == Patch_LivingKhorinis_Mercenaries) {
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply + 2, 10);
    };
};

func void Patch_LivingKhorinis_OneDay() {
    var int oldOwner;
    var int strengthMilitia;
    var int strengthMercenaries;
    oldOwner = Patch_LivingKhorinis_Owner;
    if (Patch_LivingKhorinis_Truce > 0) {
        Patch_LivingKhorinis_Truce = Patch_LivingKhorinis_Truce - 1;
        return;
    };
    Patch_LivingKhorinis_Tension = Patch_LivingKhorinis_Tension + 1;
    // The garrison consumes supplies; outside its walls the opposing faction can prepare.
    if (oldOwner == Patch_LivingKhorinis_Militia) {
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply - 1, 10);
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply + 1, 10);
    } else if (oldOwner == Patch_LivingKhorinis_Mercenaries) {
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply + 1, 10);
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply - 1, 10);
    } else {
        // The neutral crossing has no allied garrison. Onar's farms provide the better food flow.
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply + 1, 10);
    };
    if (Patch_LivingKhorinis_Tension < 3) { return; };
    strengthMilitia = Patch_LivingKhorinis_MilitiaSupply;
    strengthMercenaries = Patch_LivingKhorinis_MercenarySupply;
    // A defended post wins ties and has a small fortification advantage.
    if (oldOwner == Patch_LivingKhorinis_Militia) { strengthMilitia = strengthMilitia + 2; };
    if (oldOwner == Patch_LivingKhorinis_Mercenaries) { strengthMercenaries = strengthMercenaries + 2; };
    if (strengthMilitia > strengthMercenaries) { Patch_LivingKhorinis_Owner = Patch_LivingKhorinis_Militia; };
    if (strengthMercenaries > strengthMilitia) { Patch_LivingKhorinis_Owner = Patch_LivingKhorinis_Mercenaries; };
    Patch_LivingKhorinis_Tension = 0;
    Patch_LivingKhorinis_Truce = 2;
    if (oldOwner != Patch_LivingKhorinis_Owner) {
        Patch_LivingKhorinis_Revision = Patch_LivingKhorinis_Revision + 1;
    };
};

func void Patch_LivingKhorinis_Advance(var int day) {
    var int remaining;
    remaining = 30;
    while (Patch_LivingKhorinis_Day < day) {
        if (remaining == 0) { return; };
        Patch_LivingKhorinis_OneDay();
        Patch_LivingKhorinis_Day = Patch_LivingKhorinis_Day + 1;
        remaining = remaining - 1;
    };
};
