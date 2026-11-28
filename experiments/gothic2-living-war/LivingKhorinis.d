// Living Khorinis 0.3: day-driven logistics for the original Gothic II world.
const int Patch_LivingKhorinis_Militia = 1;
const int Patch_LivingKhorinis_Mercenaries = 2;
const int Patch_LivingKhorinis_Neutral = 3;
var int Patch_LivingKhorinis_Day;
var int Patch_LivingKhorinis_Owner;
var int Patch_LivingKhorinis_RidgeOwner;
var int Patch_LivingKhorinis_Revision;
var int Patch_LivingKhorinis_Rounds;
var int Patch_LivingKhorinis_PostLevel;
var int Patch_LivingKhorinis_RidgeLevel;
var int Patch_LivingKhorinis_PostWork;
var int Patch_LivingKhorinis_RidgeWork;
var int Patch_LivingKhorinis_Convoys;
var int Patch_LivingKhorinis_Dispatched;
var int Patch_LivingKhorinis_AttackSide;
var int Patch_LivingKhorinis_AttackPost;
var int Patch_LivingKhorinis_AttackDays;
var int Patch_LivingKhorinis_MilitiaWood;
var int Patch_LivingKhorinis_MilitiaIron;
var int Patch_LivingKhorinis_MilitiaGold;
var int Patch_LivingKhorinis_MilitiaSupply;
var int Patch_LivingKhorinis_MilitiaTroops;
var int Patch_LivingKhorinis_MercenaryWood;
var int Patch_LivingKhorinis_MercenaryIron;
var int Patch_LivingKhorinis_MercenaryGold;
var int Patch_LivingKhorinis_MercenarySupply;
var int Patch_LivingKhorinis_MercenaryTroops;
var int Patch_LivingKhorinis_FreeWood;
var int Patch_LivingKhorinis_FreeIron;
var int Patch_LivingKhorinis_FreeGold;
var int Patch_LivingKhorinis_FreeSupply;
var int Patch_LivingKhorinis_FreeTroops;
var int Patch_LivingKhorinis_FireWood;
var int Patch_LivingKhorinis_FireIron;
var int Patch_LivingKhorinis_FireGold;
var int Patch_LivingKhorinis_FireSupply;
var int Patch_LivingKhorinis_FireTroops;
var int Patch_LivingKhorinis_WaterWood;
var int Patch_LivingKhorinis_WaterIron;
var int Patch_LivingKhorinis_WaterGold;
var int Patch_LivingKhorinis_WaterSupply;
var int Patch_LivingKhorinis_WaterTroops;
var int Patch_LivingKhorinis_MilitiaFire;
var int Patch_LivingKhorinis_MilitiaWater;
var int Patch_LivingKhorinis_MercenaryFire;
var int Patch_LivingKhorinis_MercenaryWater;
var int Patch_LivingKhorinis_MercenarySect;

func int Patch_LivingKhorinis_Bounded(var int value, var int maximum) {
    if (value < 0) { return 0; };
    if (value > maximum) { return maximum; };
    return value;
};

func void Patch_LivingKhorinis_Begin(var int day) {
    Patch_LivingKhorinis_Day = day;
    Patch_LivingKhorinis_Owner = Patch_LivingKhorinis_Neutral;
    Patch_LivingKhorinis_RidgeOwner = Patch_LivingKhorinis_Mercenaries;
    Patch_LivingKhorinis_Revision = 0;
    Patch_LivingKhorinis_Rounds = 0;
    Patch_LivingKhorinis_PostLevel = 1;
    Patch_LivingKhorinis_RidgeLevel = 1;
    Patch_LivingKhorinis_PostWork = 0;
    Patch_LivingKhorinis_RidgeWork = 0;
    Patch_LivingKhorinis_Convoys = 0;
    Patch_LivingKhorinis_Dispatched = 0;
    Patch_LivingKhorinis_AttackSide = 0;
    Patch_LivingKhorinis_AttackPost = 0;
    Patch_LivingKhorinis_AttackDays = 0;
    Patch_LivingKhorinis_MilitiaWood = 14;
    Patch_LivingKhorinis_MilitiaIron = 8;
    Patch_LivingKhorinis_MilitiaGold = 9;
    Patch_LivingKhorinis_MilitiaSupply = 15;
    Patch_LivingKhorinis_MilitiaTroops = 6;
    Patch_LivingKhorinis_MercenaryWood = 17;
    Patch_LivingKhorinis_MercenaryIron = 12;
    Patch_LivingKhorinis_MercenaryGold = 9;
    Patch_LivingKhorinis_MercenarySupply = 22;
    Patch_LivingKhorinis_MercenaryTroops = 8;
    Patch_LivingKhorinis_FreeWood = 8;
    Patch_LivingKhorinis_FreeIron = 6;
    Patch_LivingKhorinis_FreeGold = 5;
    Patch_LivingKhorinis_FreeSupply = 20;
    Patch_LivingKhorinis_FreeTroops = 2;
    Patch_LivingKhorinis_FireWood = 9;
    Patch_LivingKhorinis_FireIron = 8;
    Patch_LivingKhorinis_FireGold = 6;
    Patch_LivingKhorinis_FireSupply = 17;
    Patch_LivingKhorinis_FireTroops = 3;
    Patch_LivingKhorinis_WaterWood = 9;
    Patch_LivingKhorinis_WaterIron = 8;
    Patch_LivingKhorinis_WaterGold = 6;
    Patch_LivingKhorinis_WaterSupply = 17;
    Patch_LivingKhorinis_WaterTroops = 3;
    Patch_LivingKhorinis_MilitiaFire = 0;
    Patch_LivingKhorinis_MilitiaWater = 0;
    Patch_LivingKhorinis_MercenaryFire = 0;
    Patch_LivingKhorinis_MercenaryWater = 0;
    Patch_LivingKhorinis_MercenarySect = 0;
};

func void Patch_LivingKhorinis_Deliver(var int side) {
    if (side == Patch_LivingKhorinis_Militia) {
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply + 5, 100);
    };
    if (side == Patch_LivingKhorinis_Mercenaries) {
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply + 5, 100);
    };
};

func void Patch_LivingKhorinis_Harvest() {
    // Jobs come from each faction's finite population. Soldiers reduce the workers available.
    if (Patch_LivingKhorinis_MilitiaTroops < 8) {
        Patch_LivingKhorinis_MilitiaWood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaWood + 12, 100);
        Patch_LivingKhorinis_MilitiaIron = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaIron + 6, 100);
        Patch_LivingKhorinis_MilitiaGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaGold + 3, 100);
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply + 2, 100);
    };
    if (Patch_LivingKhorinis_MercenaryTroops < 14) {
        Patch_LivingKhorinis_MercenaryWood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenaryWood + 21, 100);
        Patch_LivingKhorinis_MercenaryIron = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenaryIron + 9, 100);
        Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenaryGold + 4, 100);
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply + 18, 100);
    };
    if (Patch_LivingKhorinis_FreeTroops < 5) {
        Patch_LivingKhorinis_FreeWood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FreeWood + 5, 100);
        Patch_LivingKhorinis_FreeIron = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FreeIron + 4, 100);
        Patch_LivingKhorinis_FreeGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FreeGold + 2, 100);
        Patch_LivingKhorinis_FreeSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FreeSupply + 9, 100);
    };
    if (Patch_LivingKhorinis_FireTroops < 6) {
        Patch_LivingKhorinis_FireWood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FireWood + 5, 100);
        Patch_LivingKhorinis_FireIron = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FireIron + 4, 100);
        Patch_LivingKhorinis_FireGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FireGold + 2, 100);
        Patch_LivingKhorinis_FireSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FireSupply + 7, 100);
    };
    if (Patch_LivingKhorinis_WaterTroops < 6) {
        Patch_LivingKhorinis_WaterWood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_WaterWood + 4, 100);
        Patch_LivingKhorinis_WaterIron = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_WaterIron + 5, 100);
        Patch_LivingKhorinis_WaterGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_WaterGold + 3, 100);
        Patch_LivingKhorinis_WaterSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_WaterSupply + 7, 100);
    };

    if (Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Militia) {
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply + 4, 100);
    };
    if (Patch_LivingKhorinis_RidgeOwner == Patch_LivingKhorinis_Militia) {
        Patch_LivingKhorinis_MilitiaIron = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaIron + 2, 100);
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply + 3, 100);
    };
};

func void Patch_LivingKhorinis_Trade() {
    // Akil buys timber if the Khorinis road through the tavern is open.
    if (Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Mercenaries) { return; };
    if ((Patch_LivingKhorinis_MilitiaSupply < 16) && (Patch_LivingKhorinis_FreeSupply > 25) && (Patch_LivingKhorinis_MilitiaWood >= 6)) {
        Patch_LivingKhorinis_MilitiaWood = Patch_LivingKhorinis_MilitiaWood - 6;
        Patch_LivingKhorinis_FreeWood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FreeWood + 6, 100);
        Patch_LivingKhorinis_FreeSupply = Patch_LivingKhorinis_FreeSupply - 8;
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply + 8;
        Patch_LivingKhorinis_Convoys = Patch_LivingKhorinis_Convoys + 1;
    };
};

func void Patch_LivingKhorinis_Upkeep() {
    Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply - Patch_LivingKhorinis_MilitiaTroops - 2 - Patch_LivingKhorinis_MilitiaFire - Patch_LivingKhorinis_MilitiaWater, 100);
    if ((Patch_LivingKhorinis_MilitiaSupply == 0) && (Patch_LivingKhorinis_MilitiaTroops > 2)) { Patch_LivingKhorinis_MilitiaTroops = Patch_LivingKhorinis_MilitiaTroops - 1; };
    Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply - Patch_LivingKhorinis_MercenaryTroops - 2 - Patch_LivingKhorinis_MercenaryFire - Patch_LivingKhorinis_MercenaryWater - Patch_LivingKhorinis_MercenarySect, 100);
    if ((Patch_LivingKhorinis_MercenarySupply == 0) && (Patch_LivingKhorinis_MercenaryTroops > 2)) { Patch_LivingKhorinis_MercenaryTroops = Patch_LivingKhorinis_MercenaryTroops - 1; };
    Patch_LivingKhorinis_FreeSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FreeSupply - Patch_LivingKhorinis_FreeTroops - 2, 100);
    if ((Patch_LivingKhorinis_FreeSupply == 0) && (Patch_LivingKhorinis_FreeTroops > 2)) { Patch_LivingKhorinis_FreeTroops = Patch_LivingKhorinis_FreeTroops - 1; };
    Patch_LivingKhorinis_FireSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FireSupply - Patch_LivingKhorinis_FireTroops - 2, 100);
    if ((Patch_LivingKhorinis_FireSupply == 0) && (Patch_LivingKhorinis_FireTroops > 2)) { Patch_LivingKhorinis_FireTroops = Patch_LivingKhorinis_FireTroops - 1; };
    Patch_LivingKhorinis_WaterSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_WaterSupply - Patch_LivingKhorinis_WaterTroops - 2, 100);
    if ((Patch_LivingKhorinis_WaterSupply == 0) && (Patch_LivingKhorinis_WaterTroops > 2)) { Patch_LivingKhorinis_WaterTroops = Patch_LivingKhorinis_WaterTroops - 1; };
};

func void Patch_LivingKhorinis_Invest() {
    if ((Patch_LivingKhorinis_MilitiaSupply >= 22) && (Patch_LivingKhorinis_MilitiaIron >= 5) && (Patch_LivingKhorinis_MilitiaGold >= 3) && (Patch_LivingKhorinis_MilitiaTroops < 10)) {
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 3;
        Patch_LivingKhorinis_MilitiaIron = Patch_LivingKhorinis_MilitiaIron - 5;
        Patch_LivingKhorinis_MilitiaGold = Patch_LivingKhorinis_MilitiaGold - 3;
        Patch_LivingKhorinis_MilitiaTroops = Patch_LivingKhorinis_MilitiaTroops + 1;
    };
    if ((Patch_LivingKhorinis_MilitiaFire == 0) && (Patch_LivingKhorinis_MilitiaGold >= 20) && (Patch_LivingKhorinis_MilitiaSupply >= 18) && (Patch_LivingKhorinis_FireSupply > 13)) {
        Patch_LivingKhorinis_MilitiaGold = Patch_LivingKhorinis_MilitiaGold - 12;
        Patch_LivingKhorinis_MilitiaFire = 1;
        Patch_LivingKhorinis_FireGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FireGold + 12, 100);
    };
    if ((Patch_LivingKhorinis_MilitiaWater == 0) && (Patch_LivingKhorinis_MilitiaGold >= 20) && (Patch_LivingKhorinis_MilitiaSupply >= 18) && (Patch_LivingKhorinis_WaterSupply > 13)) {
        Patch_LivingKhorinis_MilitiaGold = Patch_LivingKhorinis_MilitiaGold - 12;
        Patch_LivingKhorinis_MilitiaWater = 1;
        Patch_LivingKhorinis_WaterGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_WaterGold + 12, 100);
    };
    if ((Patch_LivingKhorinis_MercenarySupply >= 22) && (Patch_LivingKhorinis_MercenaryIron >= 5) && (Patch_LivingKhorinis_MercenaryGold >= 3) && (Patch_LivingKhorinis_MercenaryTroops < 13)) {
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 3;
        Patch_LivingKhorinis_MercenaryIron = Patch_LivingKhorinis_MercenaryIron - 5;
        Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_MercenaryGold - 3;
        Patch_LivingKhorinis_MercenaryTroops = Patch_LivingKhorinis_MercenaryTroops + 1;
    };
    if ((Patch_LivingKhorinis_MercenaryFire == 0) && (Patch_LivingKhorinis_MercenaryGold >= 20) && (Patch_LivingKhorinis_MercenarySupply >= 18) && (Patch_LivingKhorinis_FireSupply > 13)) {
        Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_MercenaryGold - 12;
        Patch_LivingKhorinis_MercenaryFire = 1;
        Patch_LivingKhorinis_FireGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FireGold + 12, 100);
    };
    if ((Patch_LivingKhorinis_MercenaryWater == 0) && (Patch_LivingKhorinis_MercenaryGold >= 20) && (Patch_LivingKhorinis_MercenarySupply >= 18) && (Patch_LivingKhorinis_WaterSupply > 13)) {
        Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_MercenaryGold - 12;
        Patch_LivingKhorinis_MercenaryWater = 1;
        Patch_LivingKhorinis_WaterGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_WaterGold + 12, 100);
    };
    if ((Patch_LivingKhorinis_MercenarySect == 0) && (Patch_LivingKhorinis_MercenaryGold >= 20) && (Patch_LivingKhorinis_MercenarySupply >= 18)) {
        Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_MercenaryGold - 12;
        Patch_LivingKhorinis_MercenarySect = 1;
    };
};

// The first level is a lookout. A two-day construction order spends real stocks once.
func void Patch_LivingKhorinis_Fortify() {
    if (Patch_LivingKhorinis_PostWork > 0) {
        Patch_LivingKhorinis_PostWork = Patch_LivingKhorinis_PostWork - 1;
        if (Patch_LivingKhorinis_PostWork == 0) { Patch_LivingKhorinis_PostLevel = 2; };
    } else if ((Patch_LivingKhorinis_PostLevel == 1) && (Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Militia) &&
        (Patch_LivingKhorinis_MilitiaWood >= 22) && (Patch_LivingKhorinis_MilitiaIron >= 8) && (Patch_LivingKhorinis_MilitiaSupply >= 4)) {
        Patch_LivingKhorinis_MilitiaWood = Patch_LivingKhorinis_MilitiaWood - 22;
        Patch_LivingKhorinis_MilitiaIron = Patch_LivingKhorinis_MilitiaIron - 8;
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 4;
        Patch_LivingKhorinis_PostWork = 2;
    } else if ((Patch_LivingKhorinis_PostLevel == 1) && (Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Mercenaries) &&
        (Patch_LivingKhorinis_MercenaryWood >= 22) && (Patch_LivingKhorinis_MercenaryIron >= 8) && (Patch_LivingKhorinis_MercenarySupply >= 4)) {
        Patch_LivingKhorinis_MercenaryWood = Patch_LivingKhorinis_MercenaryWood - 22;
        Patch_LivingKhorinis_MercenaryIron = Patch_LivingKhorinis_MercenaryIron - 8;
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 4;
        Patch_LivingKhorinis_PostWork = 2;
    };
    if (Patch_LivingKhorinis_RidgeWork > 0) {
        Patch_LivingKhorinis_RidgeWork = Patch_LivingKhorinis_RidgeWork - 1;
        if (Patch_LivingKhorinis_RidgeWork == 0) { Patch_LivingKhorinis_RidgeLevel = 2; };
    } else if ((Patch_LivingKhorinis_RidgeLevel == 1) && (Patch_LivingKhorinis_RidgeOwner == Patch_LivingKhorinis_Mercenaries) &&
        (Patch_LivingKhorinis_MercenaryWood >= 18) && (Patch_LivingKhorinis_MercenaryIron >= 14) && (Patch_LivingKhorinis_MercenarySupply >= 6)) {
        Patch_LivingKhorinis_MercenaryWood = Patch_LivingKhorinis_MercenaryWood - 18;
        Patch_LivingKhorinis_MercenaryIron = Patch_LivingKhorinis_MercenaryIron - 14;
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 6;
        Patch_LivingKhorinis_RidgeWork = 2;
    } else if ((Patch_LivingKhorinis_RidgeLevel == 1) && (Patch_LivingKhorinis_RidgeOwner == Patch_LivingKhorinis_Militia) &&
        (Patch_LivingKhorinis_MilitiaWood >= 18) && (Patch_LivingKhorinis_MilitiaIron >= 14) && (Patch_LivingKhorinis_MilitiaSupply >= 6)) {
        Patch_LivingKhorinis_MilitiaWood = Patch_LivingKhorinis_MilitiaWood - 18;
        Patch_LivingKhorinis_MilitiaIron = Patch_LivingKhorinis_MilitiaIron - 14;
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 6;
        Patch_LivingKhorinis_RidgeWork = 2;
    };
};

func void Patch_LivingKhorinis_ResolveOperation() {
    var int side;
    var int post;
    side = Patch_LivingKhorinis_AttackSide;
    post = Patch_LivingKhorinis_AttackPost;
    if (side == 0) { return; };
    if (side == Patch_LivingKhorinis_Militia) {
        if (Patch_LivingKhorinis_MilitiaSupply < 2) { Patch_LivingKhorinis_AttackDays = 0; Patch_LivingKhorinis_AttackSide = 0; return; };
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 2;
    } else {
        if (Patch_LivingKhorinis_MercenarySupply < 2) { Patch_LivingKhorinis_AttackDays = 0; Patch_LivingKhorinis_AttackSide = 0; return; };
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 2;
    };
    Patch_LivingKhorinis_AttackDays = Patch_LivingKhorinis_AttackDays - 1;
    if (Patch_LivingKhorinis_AttackDays > 0) { return; };
    if (post == 1) {
        Patch_LivingKhorinis_Owner = side;
        Patch_LivingKhorinis_PostWork = 0;
    } else {
        Patch_LivingKhorinis_RidgeOwner = side;
        Patch_LivingKhorinis_RidgeWork = 0;
    };
    Patch_LivingKhorinis_Revision = Patch_LivingKhorinis_Revision + 1;
    Patch_LivingKhorinis_AttackSide = 0;
};

func void Patch_LivingKhorinis_PlanOperation() {
    if ((Patch_LivingKhorinis_AttackSide != 0) || (Patch_LivingKhorinis_Rounds < 3)) { return; };
    // The mercenaries can supply a near-term claim on the neutral road, unless the city is provisioned first.
    if (Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Neutral) {
        if ((Patch_LivingKhorinis_MilitiaSupply >= 11) && (Patch_LivingKhorinis_MilitiaTroops >= 5)) {
            Patch_LivingKhorinis_AttackSide = Patch_LivingKhorinis_Militia;
            Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 5;
        } else if ((Patch_LivingKhorinis_MercenarySupply >= 15) && (Patch_LivingKhorinis_MercenaryTroops >= 6)) {
            Patch_LivingKhorinis_AttackSide = Patch_LivingKhorinis_Mercenaries;
            Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 5;
        };
        Patch_LivingKhorinis_AttackPost = 1;
    } else if ((Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Militia) &&
               (Patch_LivingKhorinis_MercenarySupply >= 24) &&
               (Patch_LivingKhorinis_MercenaryTroops + Patch_LivingKhorinis_MercenaryFire + Patch_LivingKhorinis_MercenaryWater + Patch_LivingKhorinis_MercenarySect >
                Patch_LivingKhorinis_MilitiaTroops + Patch_LivingKhorinis_PostLevel + 2)) {
        Patch_LivingKhorinis_AttackSide = Patch_LivingKhorinis_Mercenaries;
        Patch_LivingKhorinis_AttackPost = 1;
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 7;
    } else if ((Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Mercenaries) &&
               (Patch_LivingKhorinis_MilitiaSupply >= 20) &&
               (Patch_LivingKhorinis_MilitiaTroops + Patch_LivingKhorinis_MilitiaFire + Patch_LivingKhorinis_MilitiaWater >= 7)) {
        Patch_LivingKhorinis_AttackSide = Patch_LivingKhorinis_Militia;
        Patch_LivingKhorinis_AttackPost = 1;
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 7;
    } else if ((Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Militia) &&
               (Patch_LivingKhorinis_RidgeOwner != Patch_LivingKhorinis_Militia) &&
               (Patch_LivingKhorinis_MilitiaSupply >= 24) && (Patch_LivingKhorinis_MilitiaTroops >= 8) &&
               (Patch_LivingKhorinis_MilitiaTroops + Patch_LivingKhorinis_MilitiaFire + Patch_LivingKhorinis_MilitiaWater >= Patch_LivingKhorinis_MercenaryTroops + Patch_LivingKhorinis_RidgeLevel)) {
        Patch_LivingKhorinis_AttackSide = Patch_LivingKhorinis_Militia;
        Patch_LivingKhorinis_AttackPost = 2;
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 8;
    } else if ((Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Mercenaries) && (Patch_LivingKhorinis_RidgeOwner == Patch_LivingKhorinis_Militia) &&
               (Patch_LivingKhorinis_MercenarySupply >= 28) && (Patch_LivingKhorinis_MercenaryTroops >= 9)) {
        Patch_LivingKhorinis_AttackSide = Patch_LivingKhorinis_Mercenaries;
        Patch_LivingKhorinis_AttackPost = 2;
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 8;
    };
    if (Patch_LivingKhorinis_AttackSide != 0) {
        Patch_LivingKhorinis_AttackDays = 2;
        Patch_LivingKhorinis_Dispatched = Patch_LivingKhorinis_Dispatched + 1;
    };
};

func void Patch_LivingKhorinis_Advance(var int day) {
    var int remaining;
    remaining = 30;
    while (Patch_LivingKhorinis_Day < day) {
        if (remaining == 0) { return; };
        Patch_LivingKhorinis_Rounds = Patch_LivingKhorinis_Rounds + 1;
        Patch_LivingKhorinis_Harvest();
        Patch_LivingKhorinis_Trade();
        Patch_LivingKhorinis_Upkeep();
        Patch_LivingKhorinis_Invest();
        Patch_LivingKhorinis_Fortify();
        Patch_LivingKhorinis_ResolveOperation();
        Patch_LivingKhorinis_PlanOperation();
        Patch_LivingKhorinis_Day = Patch_LivingKhorinis_Day + 1;
        remaining = remaining - 1;
    };
};
