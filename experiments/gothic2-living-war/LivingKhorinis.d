// Living Khorinis 0.7: day-driven logistics for the original Gothic II world.
const int Patch_LivingKhorinis_Militia = 1;
const int Patch_LivingKhorinis_Mercenaries = 2;
const int Patch_LivingKhorinis_Neutral = 3;
var int Patch_LivingKhorinis_Day;
var int Patch_LivingKhorinis_Owner;
var int Patch_LivingKhorinis_RidgeOwner;
var int Patch_LivingKhorinis_DockOwner;
var int Patch_LivingKhorinis_LobartFood;
var int Patch_LivingKhorinis_OnarFarmFood;
var int Patch_LivingKhorinis_SekobFood;
var int Patch_LivingKhorinis_BengarFood;
var int Patch_LivingKhorinis_LobartCart;
var int Patch_LivingKhorinis_OnarCart;
var int Patch_LivingKhorinis_SekobCart;
var int Patch_LivingKhorinis_BengarCart;
var int Patch_LivingKhorinis_DockFood;
var int Patch_LivingKhorinis_MineFood;
var int Patch_LivingKhorinis_RidgeFood;
var int Patch_LivingKhorinis_CrossFood;
var int Patch_LivingKhorinis_GateFood;
var int Patch_LivingKhorinis_ForestCampRations;
var int Patch_LivingKhorinis_BridgeCampRations;
var int Patch_LivingKhorinis_RiverCampRations;
var int Patch_LivingKhorinis_LighthouseRoadRations;
var int Patch_LivingKhorinis_FarmRoadRations;
var int Patch_LivingKhorinis_XardasRoadRations;
var int Patch_LivingKhorinis_TavernRoadRations;
var int Patch_LivingKhorinis_ValleyRoadRations;
var int Patch_LivingKhorinis_ValleyGateRations;
var int Patch_LivingKhorinis_ForestCampOwner;
var int Patch_LivingKhorinis_BridgeCampOwner;
var int Patch_LivingKhorinis_RiverCampOwner;
var int Patch_LivingKhorinis_ClaimSide;
var int Patch_LivingKhorinis_ClaimSite;
var int Patch_LivingKhorinis_ClaimDays;
var int Patch_LivingKhorinis_CityCargo;
var int Patch_LivingKhorinis_MercCargo;
var int Patch_LivingKhorinis_CityRoute;
var int Patch_LivingKhorinis_MercRoute;
var int Patch_LivingKhorinis_CityReturn;
var int Patch_LivingKhorinis_MercReturn;
var int Patch_LivingKhorinis_Arrivals;
var int Patch_LivingKhorinis_DockWorkerLost;
var int Patch_LivingKhorinis_MineWorkerLost;
var int Patch_LivingKhorinis_CityRequest;
var int Patch_LivingKhorinis_MercRequest;
var int Patch_LivingKhorinis_CityStanding;
var int Patch_LivingKhorinis_MercStanding;
var int Patch_LivingKhorinis_MineOwner;
var int Patch_LivingKhorinis_DockClosed;
var int Patch_LivingKhorinis_MineClosed;
var int Patch_LivingKhorinis_Revision;
var int Patch_LivingKhorinis_Rounds;
var int Patch_LivingKhorinis_WarUnlocked;
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
var int Patch_LivingKhorinis_MercenaryWater;
var int Patch_LivingKhorinis_MercenarySect;
var int Patch_LivingKhorinis_SectFood;
var int Patch_LivingKhorinis_SectGold;
var int Patch_LivingKhorinis_SectCampLost;
var int Patch_LivingKhorinis_WaterCampLost;
var int Patch_LivingKhorinis_FireCampLost;
var int Patch_LivingKhorinis_CityFireLost;
var int Patch_LivingKhorinis_CityWaterLost;
var int Patch_LivingKhorinis_OnarWaterLost;
var int Patch_LivingKhorinis_OnarSectLost;

func int Patch_LivingKhorinis_Bounded(var int value, var int maximum) {
    if (value < 0) { return 0; };
    if (value > maximum) { return maximum; };
    return value;
};

func void Patch_LivingKhorinis_Begin(var int day) {
    Patch_LivingKhorinis_Day = day;
    Patch_LivingKhorinis_Owner = Patch_LivingKhorinis_Neutral;
    Patch_LivingKhorinis_RidgeOwner = Patch_LivingKhorinis_Mercenaries;
    Patch_LivingKhorinis_DockOwner = Patch_LivingKhorinis_Militia;
    Patch_LivingKhorinis_MineOwner = Patch_LivingKhorinis_Mercenaries;
    Patch_LivingKhorinis_DockClosed = 0;
    Patch_LivingKhorinis_LobartFood = 10;
    Patch_LivingKhorinis_OnarFarmFood = 8;
    Patch_LivingKhorinis_SekobFood = 7;
    Patch_LivingKhorinis_BengarFood = 6;
    Patch_LivingKhorinis_LobartCart = 0;
    Patch_LivingKhorinis_OnarCart = 0;
    Patch_LivingKhorinis_SekobCart = 0;
    Patch_LivingKhorinis_BengarCart = 0;
    Patch_LivingKhorinis_DockFood = 5;
    Patch_LivingKhorinis_MineFood = 5;
    Patch_LivingKhorinis_RidgeFood = 4;
    Patch_LivingKhorinis_CrossFood = 0;
    Patch_LivingKhorinis_GateFood = 6;
    Patch_LivingKhorinis_ForestCampRations = 0;
    Patch_LivingKhorinis_BridgeCampRations = 0;
    Patch_LivingKhorinis_RiverCampRations = 0;
    Patch_LivingKhorinis_LighthouseRoadRations = 11;
    Patch_LivingKhorinis_FarmRoadRations = 11;
    Patch_LivingKhorinis_XardasRoadRations = 11;
    Patch_LivingKhorinis_TavernRoadRations = 11;
    Patch_LivingKhorinis_ValleyRoadRations = 11;
    Patch_LivingKhorinis_ValleyGateRations = 16;
    Patch_LivingKhorinis_ForestCampOwner = 3;
    Patch_LivingKhorinis_BridgeCampOwner = 3;
    Patch_LivingKhorinis_RiverCampOwner = 3;
    Patch_LivingKhorinis_ClaimSide = 0;
    Patch_LivingKhorinis_ClaimSite = 0;
    Patch_LivingKhorinis_ClaimDays = 0;
    Patch_LivingKhorinis_CityCargo = 0;
    Patch_LivingKhorinis_MercCargo = 0;
    Patch_LivingKhorinis_CityRoute = 0;
    Patch_LivingKhorinis_MercRoute = 0;
    Patch_LivingKhorinis_CityReturn = 0;
    Patch_LivingKhorinis_MercReturn = 0;
    Patch_LivingKhorinis_Arrivals = 0;
    Patch_LivingKhorinis_DockWorkerLost = 0;
    Patch_LivingKhorinis_MineWorkerLost = 0;
    Patch_LivingKhorinis_CityRequest = 0;
    Patch_LivingKhorinis_MercRequest = 0;
    Patch_LivingKhorinis_CityStanding = 0;
    Patch_LivingKhorinis_MercStanding = 0;
    Patch_LivingKhorinis_MineClosed = 0;
    Patch_LivingKhorinis_Revision = 0;
    Patch_LivingKhorinis_Rounds = 0;
    Patch_LivingKhorinis_WarUnlocked = 0;
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
    Patch_LivingKhorinis_MercenaryWater = 0;
    Patch_LivingKhorinis_MercenarySect = 0;
    Patch_LivingKhorinis_SectFood = 14;
    Patch_LivingKhorinis_SectGold = 4;
    Patch_LivingKhorinis_SectCampLost = 0;
    Patch_LivingKhorinis_WaterCampLost = 0;
    Patch_LivingKhorinis_FireCampLost = 0;
    Patch_LivingKhorinis_CityFireLost = 0;
    Patch_LivingKhorinis_CityWaterLost = 0;
    Patch_LivingKhorinis_OnarWaterLost = 0;
    Patch_LivingKhorinis_OnarSectLost = 0;
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
    };
    if (Patch_LivingKhorinis_MercenaryTroops < 14) {
        Patch_LivingKhorinis_MercenaryWood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenaryWood + 21, 100);
        Patch_LivingKhorinis_MercenaryIron = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenaryIron + 9, 100);
        Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenaryGold + 4, 100);
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

    if (Patch_LivingKhorinis_RidgeOwner == Patch_LivingKhorinis_Militia) {
        Patch_LivingKhorinis_MilitiaIron = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaIron + 2, 100);
    };
};


// 1 tavern, 2 ridge, 3 docks, 4 mine, 5 road fort, 6–8 camps, 9–14 city stations; a convoy never feeds an enemy or an active siege.
func int Patch_LivingKhorinis_PostOwner(var int site) {
    if (site == 1) { return Patch_LivingKhorinis_Owner; };
    if (site == 2) { return Patch_LivingKhorinis_RidgeOwner; };
    if (site == 3) { return Patch_LivingKhorinis_DockOwner; };
    if (site == 4) { return Patch_LivingKhorinis_MineOwner; };
    if (site == 6) { return Patch_LivingKhorinis_ForestCampOwner; };
    if (site == 7) { return Patch_LivingKhorinis_BridgeCampOwner; };
    if (site == 8) { return Patch_LivingKhorinis_RiverCampOwner; };
    return Patch_LivingKhorinis_Militia;
};
func int Patch_LivingKhorinis_PostFood(var int site) {
    if (site == 1) { return Patch_LivingKhorinis_CrossFood; };
    if (site == 2) { return Patch_LivingKhorinis_RidgeFood; };
    if (site == 3) { return Patch_LivingKhorinis_DockFood; };
    if (site == 4) { return Patch_LivingKhorinis_MineFood; };
    if (site == 6) { return Patch_LivingKhorinis_ForestCampRations; };
    if (site == 7) { return Patch_LivingKhorinis_BridgeCampRations; };
    if (site == 8) { return Patch_LivingKhorinis_RiverCampRations; };
    if (site == 9) { return Patch_LivingKhorinis_LighthouseRoadRations; };
    if (site == 10) { return Patch_LivingKhorinis_FarmRoadRations; };
    if (site == 11) { return Patch_LivingKhorinis_XardasRoadRations; };
    if (site == 12) { return Patch_LivingKhorinis_TavernRoadRations; };
    if (site == 13) { return Patch_LivingKhorinis_ValleyRoadRations; };
    if (site == 14) { return Patch_LivingKhorinis_ValleyGateRations; };
    return Patch_LivingKhorinis_GateFood;
};
func void Patch_LivingKhorinis_SetPostFood(var int site,var int food) {
    food = Patch_LivingKhorinis_Bounded(food,24);
    if (site == 1) { Patch_LivingKhorinis_CrossFood = food; };
    if (site == 2) { Patch_LivingKhorinis_RidgeFood = food; };
    if (site == 3) { Patch_LivingKhorinis_DockFood = food; };
    if (site == 4) { Patch_LivingKhorinis_MineFood = food; };
    if (site == 5) { Patch_LivingKhorinis_GateFood = food; };
    if (site == 6) { Patch_LivingKhorinis_ForestCampRations = food; };
    if (site == 7) { Patch_LivingKhorinis_BridgeCampRations = food; };
    if (site == 8) { Patch_LivingKhorinis_RiverCampRations = food; };
    if (site == 9) { Patch_LivingKhorinis_LighthouseRoadRations = food; };
    if (site == 10) { Patch_LivingKhorinis_FarmRoadRations = food; };
    if (site == 11) { Patch_LivingKhorinis_XardasRoadRations = food; };
    if (site == 12) { Patch_LivingKhorinis_TavernRoadRations = food; };
    if (site == 13) { Patch_LivingKhorinis_ValleyRoadRations = food; };
    if (site == 14) { Patch_LivingKhorinis_ValleyGateRations = food; };
};
func int Patch_LivingKhorinis_Blocked(var int site) {
    if ((Patch_LivingKhorinis_AttackSide != 0) && (Patch_LivingKhorinis_AttackPost == site)) { return 1; };
    if ((Patch_LivingKhorinis_ClaimSide != 0) && (Patch_LivingKhorinis_ClaimSite == site)) { return 1; };
    return 0;
};
func int Patch_LivingKhorinis_PriorityPost(var int side) {
    var int site;
    var int best;
    var int mostUrgent;
    var int need;
    var int request;
    request = Patch_LivingKhorinis_MercRequest;
    if (side == Patch_LivingKhorinis_Militia) { request = Patch_LivingKhorinis_CityRequest; };
    if ((request > 0) && (Patch_LivingKhorinis_PostOwner(request) == side) && (!Patch_LivingKhorinis_Blocked(request)) && (Patch_LivingKhorinis_PostFood(request) < 16)) {
        return request;
    };
    site = 1;
    best = 0;
    mostUrgent = 0;
    while (site <= 14) {
        if ((Patch_LivingKhorinis_PostOwner(site) == side) && (!Patch_LivingKhorinis_Blocked(site))) {
            need = 9 - Patch_LivingKhorinis_PostFood(site);
            if ((site == 3) || (site == 4)) { need = need + 2; };
            if (site >= 9) { need = need - 4; };
            if (site == 14) { need = need + 2; };
            if (need > mostUrgent) { best = site; mostUrgent = need; };
        };
        site = site + 1;
    };
    return best;
};
func int Patch_LivingKhorinis_Unload(var int site,var int side,var int cargo) {
    var int start;
    if ((Patch_LivingKhorinis_PostOwner(site) != side) || (Patch_LivingKhorinis_Blocked(site))) { return cargo; };
    start = Patch_LivingKhorinis_PostFood(site);
    Patch_LivingKhorinis_SetPostFood(site,start+cargo);
    Patch_LivingKhorinis_Arrivals = Patch_LivingKhorinis_Arrivals + 1;
    return cargo - (Patch_LivingKhorinis_PostFood(site) - start);
};
func void Patch_LivingKhorinis_FarmFreight() {
    Patch_LivingKhorinis_LobartFood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_LobartFood + 13,60);
    Patch_LivingKhorinis_OnarFarmFood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_OnarFarmFood + 9,60);
    Patch_LivingKhorinis_SekobFood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_SekobFood + 8,60);
    Patch_LivingKhorinis_BengarFood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_BengarFood + 7,60);
    if (Patch_LivingKhorinis_LobartCart != 0) {
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply + Patch_LivingKhorinis_LobartCart,100);
        Patch_LivingKhorinis_LobartCart = 0;
    } else {
        Patch_LivingKhorinis_LobartCart = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_LobartFood,26);
        Patch_LivingKhorinis_LobartFood = Patch_LivingKhorinis_LobartFood - Patch_LivingKhorinis_LobartCart;
    };
    if ((Patch_LivingKhorinis_OnarCart + Patch_LivingKhorinis_SekobCart + Patch_LivingKhorinis_BengarCart) != 0) {
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply + Patch_LivingKhorinis_OnarCart + Patch_LivingKhorinis_SekobCart + Patch_LivingKhorinis_BengarCart,100);
        Patch_LivingKhorinis_OnarCart = 0; Patch_LivingKhorinis_SekobCart = 0; Patch_LivingKhorinis_BengarCart = 0;
    } else {
        Patch_LivingKhorinis_OnarCart = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_OnarFarmFood,18);
        Patch_LivingKhorinis_SekobCart = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_SekobFood,16);
        Patch_LivingKhorinis_BengarCart = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_BengarFood,14);
        Patch_LivingKhorinis_OnarFarmFood = Patch_LivingKhorinis_OnarFarmFood - Patch_LivingKhorinis_OnarCart;
        Patch_LivingKhorinis_SekobFood = Patch_LivingKhorinis_SekobFood - Patch_LivingKhorinis_SekobCart;
        Patch_LivingKhorinis_BengarFood = Patch_LivingKhorinis_BengarFood - Patch_LivingKhorinis_BengarCart;
    };
};

// Claim of an open camp is a two-day supply expedition. Camps can change hands
// but the neutral orders do not join the main city-versus-Onar war.
func int Patch_LivingKhorinis_CampStrength(var int side,var int site) {
    var int stock;
    var int power;
    if (side == 1) { stock = Patch_LivingKhorinis_MilitiaSupply; power = Patch_LivingKhorinis_MilitiaTroops; }
    else if (side == 2) { stock = Patch_LivingKhorinis_MercenarySupply; power = Patch_LivingKhorinis_MercenaryTroops; }
    else if (side == 4 && Patch_LivingKhorinis_FireCampLost == 0) { stock = Patch_LivingKhorinis_FireSupply; power = Patch_LivingKhorinis_FireTroops; }
    else if (side == 5 && Patch_LivingKhorinis_WaterCampLost == 0) { stock = Patch_LivingKhorinis_WaterSupply; power = Patch_LivingKhorinis_WaterTroops; }
    else if (side == 6 && Patch_LivingKhorinis_SectCampLost == 0) { stock = Patch_LivingKhorinis_SectFood; power = 3; }
    else { return 0; };
    if (stock < 15) { return 0; };
    power = power*2 + stock/6;
    if (site == 6 && side == 5) { power = power + 13; };
    if (site == 7 && (side == 1 || side == 4)) { power = power + 10; };
    if (site == 8 && (side == 2 || side == 6)) { power = power + 10; };
    return power;
};
func void Patch_LivingKhorinis_SpendCampFood(var int side) {
    if (side == 1) { Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 8; };
    if (side == 2) { Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 8; };
    if (side == 4) { Patch_LivingKhorinis_FireSupply = Patch_LivingKhorinis_FireSupply - 8; };
    if (side == 5) { Patch_LivingKhorinis_WaterSupply = Patch_LivingKhorinis_WaterSupply - 8; };
    if (side == 6) { Patch_LivingKhorinis_SectFood = Patch_LivingKhorinis_SectFood - 8; };
};
func void Patch_LivingKhorinis_NeutralClaims() {
    var int site;
    var int side;
    var int owner;
    var int power;
    var int margin;
    var int best;
    if ((Patch_LivingKhorinis_WarUnlocked == 0) || (Patch_LivingKhorinis_Rounds < 9)) { return; };
    if (Patch_LivingKhorinis_ClaimSide != 0) {
        Patch_LivingKhorinis_ClaimDays = Patch_LivingKhorinis_ClaimDays - 1;
        if (Patch_LivingKhorinis_ClaimDays == 0) {
            if (Patch_LivingKhorinis_CampStrength(Patch_LivingKhorinis_ClaimSide,Patch_LivingKhorinis_ClaimSite) > 0) {
                if (Patch_LivingKhorinis_ClaimSite == 6) { Patch_LivingKhorinis_ForestCampOwner = Patch_LivingKhorinis_ClaimSide; };
                if (Patch_LivingKhorinis_ClaimSite == 7) { Patch_LivingKhorinis_BridgeCampOwner = Patch_LivingKhorinis_ClaimSide; };
                if (Patch_LivingKhorinis_ClaimSite == 8) { Patch_LivingKhorinis_RiverCampOwner = Patch_LivingKhorinis_ClaimSide; };
                Patch_LivingKhorinis_SetPostFood(Patch_LivingKhorinis_ClaimSite,Patch_LivingKhorinis_PostFood(Patch_LivingKhorinis_ClaimSite)+8);
                Patch_LivingKhorinis_Revision = Patch_LivingKhorinis_Revision + 1;
            };
            Patch_LivingKhorinis_ClaimSide = 0;
        };
        return;
    };
    site = 6;
    best = 0;
    while (site <= 8) {
        owner = Patch_LivingKhorinis_PostOwner(site);
        side = 1;
        while (side <= 6) {
            if (side != owner) {
                power = Patch_LivingKhorinis_CampStrength(side,site);
                margin = power - Patch_LivingKhorinis_CampStrength(owner,site);
                if (owner != Patch_LivingKhorinis_Neutral) { margin = margin - 12; };
                if (power > 0 && margin > best) {
                    best = margin;
                    Patch_LivingKhorinis_ClaimSide = side;
                    Patch_LivingKhorinis_ClaimSite = site;
                };
            };
            side = side + 1;
        };
        site = site + 1;
    };
    if (Patch_LivingKhorinis_ClaimSide != 0) {
        Patch_LivingKhorinis_SpendCampFood(Patch_LivingKhorinis_ClaimSide);
        Patch_LivingKhorinis_ClaimDays = 2;
    };
};

func void Patch_LivingKhorinis_OutpostFreight() {
    var int remainder;
    if (Patch_LivingKhorinis_CityCargo > 0) {
        remainder = Patch_LivingKhorinis_Unload(Patch_LivingKhorinis_CityRoute,Patch_LivingKhorinis_Militia,Patch_LivingKhorinis_CityCargo);
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply + remainder,100);
        Patch_LivingKhorinis_CityCargo = 0;
        Patch_LivingKhorinis_CityReturn = 1;
    } else if (Patch_LivingKhorinis_CityReturn == 1) {
        Patch_LivingKhorinis_CityRoute = 0;
        Patch_LivingKhorinis_CityReturn = 0;
    } else if (Patch_LivingKhorinis_MilitiaSupply >= 19) {
        Patch_LivingKhorinis_CityRoute = Patch_LivingKhorinis_PriorityPost(Patch_LivingKhorinis_Militia);
        if (Patch_LivingKhorinis_CityRoute != 0) {
            Patch_LivingKhorinis_CityCargo = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply - 10,16);
            Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - Patch_LivingKhorinis_CityCargo;
            if (Patch_LivingKhorinis_CityRoute == Patch_LivingKhorinis_CityRequest) { Patch_LivingKhorinis_CityRequest = 0; };
        };
    };
    if (Patch_LivingKhorinis_MercCargo > 0) {
        remainder = Patch_LivingKhorinis_Unload(Patch_LivingKhorinis_MercRoute,Patch_LivingKhorinis_Mercenaries,Patch_LivingKhorinis_MercCargo);
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply + remainder,100);
        Patch_LivingKhorinis_MercCargo = 0;
        Patch_LivingKhorinis_MercReturn = 1;
    } else if (Patch_LivingKhorinis_MercReturn == 1) {
        Patch_LivingKhorinis_MercRoute = 0;
        Patch_LivingKhorinis_MercReturn = 0;
    } else if (Patch_LivingKhorinis_MercenarySupply >= 23) {
        Patch_LivingKhorinis_MercRoute = Patch_LivingKhorinis_PriorityPost(Patch_LivingKhorinis_Mercenaries);
        if (Patch_LivingKhorinis_MercRoute != 0) {
            Patch_LivingKhorinis_MercCargo = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply - 13,18);
            Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - Patch_LivingKhorinis_MercCargo;
            if (Patch_LivingKhorinis_MercRoute == Patch_LivingKhorinis_MercRequest) { Patch_LivingKhorinis_MercRequest = 0; };
        };
    };
};
func void Patch_LivingKhorinis_FeedGuards() {
    var int site;
    site = 1;
    while (site <= 14) {
        if ((Patch_LivingKhorinis_PostOwner(site) != Patch_LivingKhorinis_Neutral) && (site <= 5)) {
            Patch_LivingKhorinis_SetPostFood(site,Patch_LivingKhorinis_PostFood(site) - 1);
        } else if ((site >= 6) && (Patch_LivingKhorinis_PostOwner(site) != Patch_LivingKhorinis_Neutral) && ((Patch_LivingKhorinis_Rounds % 3 == 0) || (site == 14))) {
            Patch_LivingKhorinis_SetPostFood(site,Patch_LivingKhorinis_PostFood(site) - 1);
        };
        site = site + 1;
    };
};

// These are advances from two staffed sites, not global income modifiers.
func void Patch_LivingKhorinis_Industry() {
    Patch_LivingKhorinis_DockClosed = 1;
    if ((Patch_LivingKhorinis_DockWorkerLost == 0) && ((Patch_LivingKhorinis_AttackSide == 0) || (Patch_LivingKhorinis_AttackPost != 3))) {
        if ((Patch_LivingKhorinis_DockOwner == Patch_LivingKhorinis_Militia) &&
            (Patch_LivingKhorinis_DockFood >= 1) && (Patch_LivingKhorinis_MilitiaGold >= 1) && (Patch_LivingKhorinis_MilitiaTroops < 10)) {
            Patch_LivingKhorinis_MilitiaGold = Patch_LivingKhorinis_MilitiaGold - 1;
            Patch_LivingKhorinis_MilitiaWood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaWood + 6, 100);
            Patch_LivingKhorinis_DockFood = Patch_LivingKhorinis_DockFood - 1;
            Patch_LivingKhorinis_DockClosed = 0;
        } else if ((Patch_LivingKhorinis_DockOwner == Patch_LivingKhorinis_Mercenaries) &&
                   (Patch_LivingKhorinis_DockFood >= 1) && (Patch_LivingKhorinis_MercenaryGold >= 1) && (Patch_LivingKhorinis_MercenaryTroops < 15)) {
            Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_MercenaryGold - 1;
            Patch_LivingKhorinis_MercenaryWood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenaryWood + 6, 100);
            Patch_LivingKhorinis_DockFood = Patch_LivingKhorinis_DockFood - 1;
            Patch_LivingKhorinis_DockClosed = 0;
        };
    };
    Patch_LivingKhorinis_MineClosed = 1;
    if ((Patch_LivingKhorinis_MineWorkerLost == 0) && ((Patch_LivingKhorinis_AttackSide == 0) || (Patch_LivingKhorinis_AttackPost != 4))) {
        if ((Patch_LivingKhorinis_MineOwner == Patch_LivingKhorinis_Mercenaries) &&
            (Patch_LivingKhorinis_MineFood >= 1) && (Patch_LivingKhorinis_MercenaryTroops < 15)) {
            Patch_LivingKhorinis_MineFood = Patch_LivingKhorinis_MineFood - 1;
            Patch_LivingKhorinis_MercenaryIron = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenaryIron + 5, 100);
            Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenaryGold + 1, 100);
            Patch_LivingKhorinis_MineClosed = 0;
        } else if ((Patch_LivingKhorinis_MineOwner == Patch_LivingKhorinis_Militia) &&
                   (Patch_LivingKhorinis_MineFood >= 1) && (Patch_LivingKhorinis_MilitiaTroops < 10)) {
            Patch_LivingKhorinis_MineFood = Patch_LivingKhorinis_MineFood - 1;
            Patch_LivingKhorinis_MilitiaIron = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaIron + 5, 100);
            Patch_LivingKhorinis_MilitiaGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaGold + 1, 100);
            Patch_LivingKhorinis_MineClosed = 0;
        };
    };
};

func void Patch_LivingKhorinis_Trade() {
    // Akil buys timber if the Khorinis road through the tavern is open.
    if (Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Mercenaries) { return; };
    if ((Patch_LivingKhorinis_MilitiaSupply < 16) && (Patch_LivingKhorinis_FreeSupply > 25) && (Patch_LivingKhorinis_MilitiaWood >= 6)) {
        Patch_LivingKhorinis_MilitiaWood = Patch_LivingKhorinis_MilitiaWood - 6;
        Patch_LivingKhorinis_FreeWood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FreeWood + 6, 100);
        Patch_LivingKhorinis_FreeSupply = Patch_LivingKhorinis_FreeSupply - 8;
        Patch_LivingKhorinis_LobartFood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_LobartFood + 8,60);
        Patch_LivingKhorinis_Convoys = Patch_LivingKhorinis_Convoys + 1;
    };
};

func void Patch_LivingKhorinis_Upkeep() {
    Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MilitiaSupply - Patch_LivingKhorinis_MilitiaTroops - 2 - Patch_LivingKhorinis_MilitiaFire - Patch_LivingKhorinis_MilitiaWater, 100);
    if ((Patch_LivingKhorinis_MilitiaSupply == 0) && (Patch_LivingKhorinis_MilitiaTroops > 2)) { Patch_LivingKhorinis_MilitiaTroops = Patch_LivingKhorinis_MilitiaTroops - 1; };
    Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercenarySupply - Patch_LivingKhorinis_MercenaryTroops - 2 - Patch_LivingKhorinis_MercenaryWater - Patch_LivingKhorinis_MercenarySect, 100);
    if ((Patch_LivingKhorinis_MercenarySupply == 0) && (Patch_LivingKhorinis_MercenaryTroops > 2)) { Patch_LivingKhorinis_MercenaryTroops = Patch_LivingKhorinis_MercenaryTroops - 1; };
    Patch_LivingKhorinis_FreeSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FreeSupply - Patch_LivingKhorinis_FreeTroops - 2, 100);
    if ((Patch_LivingKhorinis_FreeSupply == 0) && (Patch_LivingKhorinis_FreeTroops > 2)) { Patch_LivingKhorinis_FreeTroops = Patch_LivingKhorinis_FreeTroops - 1; };
    Patch_LivingKhorinis_FireSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FireSupply - Patch_LivingKhorinis_FireTroops - 2, 100);
    if ((Patch_LivingKhorinis_FireSupply == 0) && (Patch_LivingKhorinis_FireTroops > 2)) { Patch_LivingKhorinis_FireTroops = Patch_LivingKhorinis_FireTroops - 1; };
    Patch_LivingKhorinis_WaterSupply = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_WaterSupply - Patch_LivingKhorinis_WaterTroops - 2, 100);
    if ((Patch_LivingKhorinis_WaterSupply == 0) && (Patch_LivingKhorinis_WaterTroops > 2)) { Patch_LivingKhorinis_WaterTroops = Patch_LivingKhorinis_WaterTroops - 1; };
};

// The brotherhood eats from its own camp and is not a payroll option for the city.
func void Patch_LivingKhorinis_TendSect() {
    if (Patch_LivingKhorinis_SectCampLost == 0) {
        Patch_LivingKhorinis_SectFood = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_SectFood + 1,28);
    };
};
func int Patch_LivingKhorinis_CanHireSect() {
    if ((Patch_LivingKhorinis_SectCampLost != 0) || (Patch_LivingKhorinis_OnarSectLost != 0) || (Patch_LivingKhorinis_MercenarySect != 0)) { return 0; };
    return (Patch_LivingKhorinis_SectFood >= 10) && (Patch_LivingKhorinis_MercenaryGold >= 16) && (Patch_LivingKhorinis_MercenarySupply >= 12);
};
func void Patch_LivingKhorinis_HireSect() {
    if (!Patch_LivingKhorinis_CanHireSect()) { return; };
    Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_MercenaryGold - 12;
    Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 2;
    Patch_LivingKhorinis_SectGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_SectGold + 12,100);
    Patch_LivingKhorinis_SectFood = Patch_LivingKhorinis_SectFood - 3;
    Patch_LivingKhorinis_MercenarySect = 1;
};

func void Patch_LivingKhorinis_Invest() {
    if ((Patch_LivingKhorinis_MilitiaSupply >= 22) && (Patch_LivingKhorinis_MilitiaIron >= 5) && (Patch_LivingKhorinis_MilitiaGold >= 3) && (Patch_LivingKhorinis_MilitiaTroops < 10)) {
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 3;
        Patch_LivingKhorinis_MilitiaIron = Patch_LivingKhorinis_MilitiaIron - 5;
        Patch_LivingKhorinis_MilitiaGold = Patch_LivingKhorinis_MilitiaGold - 3;
        Patch_LivingKhorinis_MilitiaTroops = Patch_LivingKhorinis_MilitiaTroops + 1;
    };
    if ((Patch_LivingKhorinis_MilitiaFire == 0) && (Patch_LivingKhorinis_CityFireLost == 0) && (Patch_LivingKhorinis_FireCampLost == 0) && (Patch_LivingKhorinis_MilitiaGold >= 20) && (Patch_LivingKhorinis_MilitiaSupply >= 18) && (Patch_LivingKhorinis_FireSupply > 13)) {
        Patch_LivingKhorinis_MilitiaGold = Patch_LivingKhorinis_MilitiaGold - 12;
        Patch_LivingKhorinis_MilitiaFire = 1;
        Patch_LivingKhorinis_FireSupply = Patch_LivingKhorinis_FireSupply - 3;
        Patch_LivingKhorinis_FireGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_FireGold + 12, 100);
    };
    if ((Patch_LivingKhorinis_MilitiaWater == 0) && (Patch_LivingKhorinis_CityWaterLost == 0) && (Patch_LivingKhorinis_WaterCampLost == 0) && (Patch_LivingKhorinis_MilitiaGold >= 20) && (Patch_LivingKhorinis_MilitiaSupply >= 18) && (Patch_LivingKhorinis_WaterSupply > 13)) {
        Patch_LivingKhorinis_MilitiaGold = Patch_LivingKhorinis_MilitiaGold - 12;
        Patch_LivingKhorinis_MilitiaWater = 1;
        Patch_LivingKhorinis_WaterSupply = Patch_LivingKhorinis_WaterSupply - 3;
        Patch_LivingKhorinis_WaterGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_WaterGold + 12, 100);
    };
    if ((Patch_LivingKhorinis_MercenarySupply >= 22) && (Patch_LivingKhorinis_MercenaryIron >= 5) && (Patch_LivingKhorinis_MercenaryGold >= 3) && (Patch_LivingKhorinis_MercenaryTroops < 13)) {
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 3;
        Patch_LivingKhorinis_MercenaryIron = Patch_LivingKhorinis_MercenaryIron - 5;
        Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_MercenaryGold - 3;
        Patch_LivingKhorinis_MercenaryTroops = Patch_LivingKhorinis_MercenaryTroops + 1;
    };
    if ((Patch_LivingKhorinis_MercenaryWater == 0) && (Patch_LivingKhorinis_OnarWaterLost == 0) && (Patch_LivingKhorinis_WaterCampLost == 0) && (Patch_LivingKhorinis_MercenaryGold >= 31) && (Patch_LivingKhorinis_MercenarySupply >= 22) && (Patch_LivingKhorinis_WaterSupply > 32)) {
        Patch_LivingKhorinis_MercenaryGold = Patch_LivingKhorinis_MercenaryGold - 12;
        Patch_LivingKhorinis_MercenaryWater = 1;
        Patch_LivingKhorinis_WaterSupply = Patch_LivingKhorinis_WaterSupply - 5;
        Patch_LivingKhorinis_WaterGold = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_WaterGold + 12, 100);
    };
    Patch_LivingKhorinis_HireSect();
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
    } else if (post == 2) {
        Patch_LivingKhorinis_RidgeOwner = side;
        Patch_LivingKhorinis_RidgeWork = 0;
    } else if (post == 3) {
        Patch_LivingKhorinis_DockOwner = side;
    } else if (post == 4) {
        Patch_LivingKhorinis_MineOwner = side;
    };
    Patch_LivingKhorinis_Revision = Patch_LivingKhorinis_Revision + 1;
    Patch_LivingKhorinis_AttackSide = 0;
};

func int Patch_LivingKhorinis_PlanIndustry() {
    var int cityPower;
    var int onarPower;
    cityPower = Patch_LivingKhorinis_MilitiaTroops + Patch_LivingKhorinis_MilitiaFire + Patch_LivingKhorinis_MilitiaWater;
    onarPower = Patch_LivingKhorinis_MercenaryTroops + Patch_LivingKhorinis_MercenaryWater + Patch_LivingKhorinis_MercenarySect;
    if (Patch_LivingKhorinis_Rounds < 9) { return 0; };
    // A defended home post requires a controlled supply route and manpower.
    if ((Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Mercenaries) &&
        (Patch_LivingKhorinis_DockOwner != Patch_LivingKhorinis_Mercenaries) &&
        (Patch_LivingKhorinis_MercenarySupply >= 15) && (onarPower >= cityPower + 4)) {
        Patch_LivingKhorinis_AttackSide = Patch_LivingKhorinis_Mercenaries;
        Patch_LivingKhorinis_AttackPost = 3;
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 10;
    } else if ((Patch_LivingKhorinis_RidgeOwner == Patch_LivingKhorinis_Militia) &&
               (Patch_LivingKhorinis_MineOwner != Patch_LivingKhorinis_Militia) &&
               (Patch_LivingKhorinis_MilitiaSupply >= 25) && (cityPower >= onarPower + 4)) {
        Patch_LivingKhorinis_AttackSide = Patch_LivingKhorinis_Militia;
        Patch_LivingKhorinis_AttackPost = 4;
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 10;
    } else if ((Patch_LivingKhorinis_DockOwner != Patch_LivingKhorinis_Militia) &&
               (Patch_LivingKhorinis_MilitiaSupply >= 22) && (cityPower >= onarPower + 2)) {
        Patch_LivingKhorinis_AttackSide = Patch_LivingKhorinis_Militia;
        Patch_LivingKhorinis_AttackPost = 3;
        Patch_LivingKhorinis_MilitiaSupply = Patch_LivingKhorinis_MilitiaSupply - 8;
    } else if ((Patch_LivingKhorinis_MineOwner != Patch_LivingKhorinis_Mercenaries) &&
               (Patch_LivingKhorinis_MercenarySupply >= 22) && (onarPower >= cityPower + 2)) {
        Patch_LivingKhorinis_AttackSide = Patch_LivingKhorinis_Mercenaries;
        Patch_LivingKhorinis_AttackPost = 4;
        Patch_LivingKhorinis_MercenarySupply = Patch_LivingKhorinis_MercenarySupply - 8;
    };
    if (Patch_LivingKhorinis_AttackSide == 0) { return 0; };
    if (Patch_LivingKhorinis_AttackPost == 3) { Patch_LivingKhorinis_DockClosed = 1; };
    if (Patch_LivingKhorinis_AttackPost == 4) { Patch_LivingKhorinis_MineClosed = 1; };
    Patch_LivingKhorinis_AttackDays = 2;
    Patch_LivingKhorinis_Dispatched = Patch_LivingKhorinis_Dispatched + 1;
    return 1;
};

func void Patch_LivingKhorinis_PlanOperation() {
    if (Patch_LivingKhorinis_WarUnlocked == 0) { return; };
    if ((Patch_LivingKhorinis_AttackSide != 0) || (Patch_LivingKhorinis_Rounds < 3)) { return; };
    if (Patch_LivingKhorinis_PlanIndustry()) { return; };
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
               (Patch_LivingKhorinis_MercenarySupply >= 22) &&
               (Patch_LivingKhorinis_MercenaryTroops + Patch_LivingKhorinis_MercenaryWater + Patch_LivingKhorinis_MercenarySect >
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
        Patch_LivingKhorinis_FarmFreight();
        Patch_LivingKhorinis_Upkeep();
        Patch_LivingKhorinis_OutpostFreight();
        Patch_LivingKhorinis_FeedGuards();
        Patch_LivingKhorinis_Industry();
        Patch_LivingKhorinis_TendSect();
        Patch_LivingKhorinis_Invest();
        Patch_LivingKhorinis_Fortify();
        Patch_LivingKhorinis_ResolveOperation();
        Patch_LivingKhorinis_PlanOperation();
        Patch_LivingKhorinis_NeutralClaims();
        Patch_LivingKhorinis_Day = Patch_LivingKhorinis_Day + 1;
        remaining = remaining - 1;
    };
};
