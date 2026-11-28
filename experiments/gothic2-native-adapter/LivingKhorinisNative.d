// Living Khorinis: Dead Harpy crossing. Gothic II: Night of the Raven.
// Load after Gothic.src's story NPCs and core rules, before the NewWorld hook.
const string LKN_RoadPost = "TAVERNE";
const string LKN_QuartermasterPost = "NW_TAVERNE_IN_07";
const string LKN_NeutralName = "Neutral tavern lookout";
const string LKN_MilitiaName = "Khorinis militia lookout";
const string LKN_MercenaryName = "Onar's mercenary lookout";
var int LKN_Initialized;
var int LKN_Busy;
var int LKN_LastDeliveryDay;
var int LKN_VisibleOwner;
var int LKN_VisibleRidge;
var int LKN_LastDispatch;
var int LKN_PhysicalClash;

func void LKN_TA_Guard() {
    TA_Stand_Guarding(6, 0, 18, 0, LKN_RoadPost);
    TA_Stand_Guarding(18, 0, 6, 0, LKN_RoadPost);
};

instance LKN_PostGuard(Npc_Default) {
    id = 61032;
    name[0] = LKN_NeutralName;
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self, 2);
    B_SetNpcVisual(self, MALE, "Hum_Head_Bald", Face_N_Normal01, BodyTex_N, ItAr_Bau_M);
    daily_routine = LKN_TA_Guard;
};


const string LKN_RidgeWP = "NW_BIGFARM_FARM4_PATH_01";
func void LKN_TA_Ridge() {
    TA_Stand_Guarding(6,0,18,0,LKN_RidgeWP);
    TA_Stand_Guarding(18,0,6,0,LKN_RidgeWP);
};
instance LKN_Ridge(Npc_Default) {
    id = 61033;
    name[0] = "Ridge lookout";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    daily_routine = LKN_TA_Ridge;
};

const string LKN_GateWP = "NW_CITY_ENTRANCE_01";
func void LKN_TA_Gate() {
    TA_Stand_Guarding(6,0,18,0,LKN_GateWP);
    TA_Stand_Guarding(18,0,6,0,LKN_GateWP);
};
instance LKN_Gate(Npc_Default) {
    id = 61034;
    name[0] = "Khorinis gate watch";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Mil_L);
    daily_routine = LKN_TA_Gate;
};

const string LKN_OnarWorkerWP = "NW_BIGFARM_PATH_02";
func void LKN_TA_OnarWorker() {
    TA_Pick_FP(8,0,18,0,"NW_BIGFARM_FIELD_01");
    TA_Stand_WP(18,0,8,0,LKN_OnarWorkerWP);
};
instance LKN_OnarWorker(Npc_Default) {
    id = 61036;
    name[0] = "Onar farm worker";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_OnarWorker;
};

const string LKN_SekobWorkerWP = "NW_FARM4_02";
func void LKN_TA_SekobWorker() {
    TA_Pick_FP(8,0,18,0,"NW_FARM4_FIELD_02");
    TA_Stand_WP(18,0,8,0,LKN_SekobWorkerWP);
};
instance LKN_SekobWorker(Npc_Default) {
    id = 61037;
    name[0] = "Sekob farm worker";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_SekobWorker;
};

const string LKN_BengarWorkerWP = "NW_FARM3_BENGAR";
func void LKN_TA_BengarWorker() {
    TA_Rake_FP(8,0,18,0,"NW_FARM3_FIELD_01");
    TA_Stand_WP(18,0,8,0,LKN_BengarWorkerWP);
};
instance LKN_BengarWorker(Npc_Default) {
    id = 61038;
    name[0] = "Bengar farm worker";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_BengarWorker;
};

const string LKN_FreeFarmerWP = "FARM2";
func void LKN_TA_FreeFarmer() {
    TA_Rake_FP(8,0,18,0,"NW_FARM2_FIELD_05");
    TA_Stand_WP(18,0,8,0,LKN_FreeFarmerWP);
};
instance LKN_FreeFarmer(Npc_Default) {
    id = 61039;
    name[0] = "Independent farm worker";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_FreeFarmer;
};

const string LKN_FireNoviceWP = "NW_MONASTERY_ENTRY_01";
func void LKN_TA_FireNovice() {
    TA_Stand_WP(6,0,18,0,LKN_FireNoviceWP);
    TA_Stand_WP(18,0,6,0,LKN_FireNoviceWP);
};
instance LKN_FireNovice(Npc_Default) {
    id = 61040;
    name[0] = "Novice of the Fire order";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_NOV_L);
    daily_routine = LKN_TA_FireNovice;
};

const string LKN_WaterNoviceWP = "ADW_ENTRANCE_BUILDING2_04";
func void LKN_TA_WaterNovice() {
    TA_Study_WP(6,0,18,0,LKN_WaterNoviceWP);
    TA_Study_WP(18,0,6,0,LKN_WaterNoviceWP);
};
instance LKN_WaterNovice(Npc_Default) {
    id = 61041;
    name[0] = "Novice of the Water order";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_WaterNovice;
};

const string LKN_CityScoutWP = "NW_FARM1_PATH_CITY_19_B";
func void LKN_TA_CityScout() {
    TA_Stand_Guarding(6,0,18,0,LKN_CityScoutWP);
    TA_Stand_Guarding(18,0,6,0,LKN_CityScoutWP);
};
instance LKN_CityScout(Npc_Default) {
    id = 61042;
    name[0] = "Expedition guard of Khorinis";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Mil_L);
    daily_routine = LKN_TA_CityScout;
};

const string LKN_OnarScoutWP = "NW_BIGFARM_PATH_01";
func void LKN_TA_OnarScout() {
    TA_Stand_Guarding(6,0,18,0,LKN_OnarScoutWP);
    TA_Stand_Guarding(18,0,6,0,LKN_OnarScoutWP);
};
instance LKN_OnarScout(Npc_Default) {
    id = 61043;
    name[0] = "Expedition mercenary of Onar";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    daily_routine = LKN_TA_OnarScout;
};

// Static-looking world props use the shared engine's supported item insertion.
var int LKN_CrossPlaced;
var int LKN_RidgePlaced;
var int LKN_CrossGarrisonSide;
var int LKN_RidgeGarrisonSide;

instance LKN_CrossBuilding(C_Item) {
    name = "Road supply shelter";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_CROSS.3DS";
    value = 0;
};
instance LKN_RidgeBuilding(C_Item) {
    name = "Ridge watchtower";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_STONE;
    visual = "LKN_RIDGE.3DS";
    value = 0;
};
const string LKN_CrossReserveWP = "NW_TAVERNE_IN_07";
const string LKN_RidgeReserveWP = "NW_FARM4_02";
func void LKN_TA_CrossReserve() {
    TA_Stand_Guarding(6,0,18,0,LKN_CrossReserveWP);
    TA_Stand_Guarding(18,0,6,0,LKN_CrossReserveWP);
};
func void LKN_TA_RidgeReserve() {
    TA_Stand_Guarding(6,0,18,0,LKN_RidgeReserveWP);
    TA_Stand_Guarding(18,0,6,0,LKN_RidgeReserveWP);
};
instance LKN_CrossReserve(Npc_Default) {
    id = 61044;
    name[0] = "Road garrison soldier";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Mil_L);
    daily_routine = LKN_TA_CrossReserve;
};
instance LKN_RidgeReserve(Npc_Default) {
    id = 61045;
    name[0] = "Ridge garrison soldier";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    daily_routine = LKN_TA_RidgeReserve;
};
func void LKN_GarrisonUniform(var C_NPC unit, var int side) {
    if (side == Patch_LivingKhorinis_Militia) {
        unit.name[0] = LKN_MilitiaName;
        B_SetNpcVisual(unit,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Mil_L);
        Npc_RemoveInvItems(unit,ItAr_Sld_L,1);
    } else {
        unit.name[0] = LKN_MercenaryName;
        B_SetNpcVisual(unit,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
        Npc_RemoveInvItems(unit,ItAr_Mil_L,1);
    };
};

func void LKN_ConstructionVisuals() {
    var C_NPC oldSelf;
    var C_NPC oldOther;
    var C_NPC reserve;
    oldSelf = self;
    oldOther = other;
    if (Patch_LivingKhorinis_PostLevel == 2) {
        if (LKN_CrossPlaced == 0) {
            Wld_InsertItem(LKN_CrossBuilding,LKN_RoadPost);
            LKN_CrossPlaced = 1;
        };
        reserve = Hlp_GetNpc(LKN_CrossReserve);
        if (!Hlp_IsValidNpc(reserve)) {
            Wld_InsertNpc(LKN_CrossReserve,LKN_CrossReserveWP);
            reserve = Hlp_GetNpc(LKN_CrossReserve);
            LKN_CrossGarrisonSide = 0;
        };
        if (Hlp_IsValidNpc(reserve) && (LKN_CrossGarrisonSide != Patch_LivingKhorinis_Owner)) {
            LKN_GarrisonUniform(reserve,Patch_LivingKhorinis_Owner);
            LKN_CrossGarrisonSide = Patch_LivingKhorinis_Owner;
        };
    };
    if (Patch_LivingKhorinis_RidgeLevel == 2) {
        if (LKN_RidgePlaced == 0) {
            Wld_InsertItem(LKN_RidgeBuilding,LKN_RidgeWP);
            LKN_RidgePlaced = 1;
        };
        reserve = Hlp_GetNpc(LKN_RidgeReserve);
        if (!Hlp_IsValidNpc(reserve)) {
            Wld_InsertNpc(LKN_RidgeReserve,LKN_RidgeReserveWP);
            reserve = Hlp_GetNpc(LKN_RidgeReserve);
            LKN_RidgeGarrisonSide = 0;
        };
        if (Hlp_IsValidNpc(reserve) && (LKN_RidgeGarrisonSide != Patch_LivingKhorinis_RidgeOwner)) {
            LKN_GarrisonUniform(reserve,Patch_LivingKhorinis_RidgeOwner);
            LKN_RidgeGarrisonSide = Patch_LivingKhorinis_RidgeOwner;
        };
    };
    self = oldSelf;
    other = oldOther;
};

// Existing NewWorld waypoints. Use only newly defined actor instances.
const string LKN_DockWP = "NW_CITY_HABOUR_09";
const string LKN_DockWorkWP = "NW_CITY_HABOUR_08";
const string LKN_MineWP = "NW_CASTLEMINE_PATH_OUTSIDEHUT_02";
const string LKN_MineWorkWP = "NW_CASTLEMINE_PATH_HUT_02";
const string LKN_LoyalPaladin = "Paladin of the supply watch";
const string LKN_OreMercenary = "Mercenary of the supply watch";
var int LKN_DockPlaced;
var int LKN_MinePlaced;
var int LKN_VisibleDock;
var int LKN_VisibleMine;

instance LKN_DockBuilding(C_Item) {
    name = "Paladins' timber depot";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_DOCK.3DS";
    value = 0;
};
instance LKN_MineBuilding(C_Item) {
    name = "Old mine supply camp";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_STONE;
    visual = "LKN_MINE.3DS";
    value = 0;
};
func void LKN_TA_DockGuard() {
    TA_Min(self,6,0,18,0,ZS_LKN_Quartermaster,LKN_DockWP);
    TA_Min(self,18,0,6,0,ZS_LKN_Quartermaster,LKN_DockWP);
};
instance LKN_DockGuard(Npc_Default) {
    id = 61046;
    name[0] = LKN_LoyalPaladin;
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Pal_M);
    daily_routine = LKN_TA_DockGuard;
};
func void LKN_TA_MineGuard() {
    TA_Min(self,6,0,18,0,ZS_LKN_Quartermaster,LKN_MineWP);
    TA_Min(self,18,0,6,0,ZS_LKN_Quartermaster,LKN_MineWP);
};
instance LKN_MineGuard(Npc_Default) {
    id = 61047;
    name[0] = LKN_OreMercenary;
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    daily_routine = LKN_TA_MineGuard;
};
func void LKN_TA_DockWorker() {
    // Second shift: do not reserve the saw while the stock harbour worker is using it.
    TA_Stand_WP(4,40,19,20,LKN_DockWP);
    TA_Saw(19,20,4,40,LKN_DockWorkWP);
};
instance LKN_DockWorker(Npc_Default) {
    id = 61048;
    name[0] = "Harbour sawyer";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_DockWorker;
};
func void LKN_TA_MineWorker() {
    TA_Pick_Ore(8,0,18,0,LKN_MineWorkWP);
    TA_Stand_WP(18,0,8,0,LKN_MineWP);
};
instance LKN_MineWorker(Npc_Default) {
    id = 61049;
    name[0] = "Miner from Onar's lands";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_MineWorker;
};

func void LKN_IndustryUniform(var C_NPC guard, var int side) {
    if (side == Patch_LivingKhorinis_Militia) {
        guard.name[0] = LKN_LoyalPaladin;
        B_SetNpcVisual(guard,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Pal_M);
        Npc_RemoveInvItems(guard,ItAr_Sld_L,1);
    } else {
        guard.name[0] = LKN_OreMercenary;
        B_SetNpcVisual(guard,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
        Npc_RemoveInvItems(guard,ItAr_Pal_M,1);
    };
};
func void LKN_IndustryVisuals() {
    var C_NPC oldSelf;
    var C_NPC oldOther;
    var C_NPC guard;
    oldSelf = self;
    oldOther = other;
    if (LKN_DockPlaced == 0) { Wld_InsertItem(LKN_DockBuilding,LKN_DockWP); LKN_DockPlaced = 1; };
    if (LKN_MinePlaced == 0) { Wld_InsertItem(LKN_MineBuilding,LKN_MineWP); LKN_MinePlaced = 1; };
    if (LKN_VisibleDock != Patch_LivingKhorinis_DockOwner) {
        guard = Hlp_GetNpc(LKN_DockGuard);
        if (Hlp_IsValidNpc(guard)) {
            LKN_IndustryUniform(guard,Patch_LivingKhorinis_DockOwner);
            LKN_VisibleDock = Patch_LivingKhorinis_DockOwner;
        };
    };
    if (LKN_VisibleMine != Patch_LivingKhorinis_MineOwner) {
        guard = Hlp_GetNpc(LKN_MineGuard);
        if (Hlp_IsValidNpc(guard)) {
            LKN_IndustryUniform(guard,Patch_LivingKhorinis_MineOwner);
            LKN_VisibleMine = Patch_LivingKhorinis_MineOwner;
        };
    };
    self = oldSelf;
    other = oldOther;
};

func void LKN_RoadOrders() {
    var C_NPC cityScout;
    var C_NPC onarScout;
    var C_NPC prior;
    var string objective;
    var int side;
    if (Patch_LivingKhorinis_Dispatched == 0) { return; };
    cityScout = Hlp_GetNpc(LKN_CityScout);
    onarScout = Hlp_GetNpc(LKN_OnarScout);
    if ((!Hlp_IsValidNpc(cityScout)) || (!Hlp_IsValidNpc(onarScout))) { return; };
    side = Patch_LivingKhorinis_AttackSide;
    if (side == 0) {
        if (LKN_LastDispatch != 0) {
            LKN_LastDispatch = 0;
            Npc_ClearAIQueue(cityScout);
            Npc_ClearAIQueue(onarScout);
            AI_GotoWP(cityScout,LKN_CityScoutWP);
            AI_GotoWP(onarScout,LKN_OnarScoutWP);
        };
        return;
    };
    if (Patch_LivingKhorinis_AttackPost == 1) { objective = LKN_RoadPost; }
    else if (Patch_LivingKhorinis_AttackPost == 2) { objective = LKN_RidgeWP; }
    else if (Patch_LivingKhorinis_AttackPost == 3) { objective = LKN_DockWP; }
    else { objective = LKN_MineWP; };
    if (LKN_LastDispatch != Patch_LivingKhorinis_Dispatched) {
        LKN_LastDispatch = Patch_LivingKhorinis_Dispatched;
        Npc_ClearAIQueue(cityScout);
        Npc_ClearAIQueue(onarScout);
        AI_GotoWP(cityScout,objective);
        AI_GotoWP(onarScout,objective);
    };
    // A close-range encounter has no authority to affect the simulated capture,
    // so distant events give the same result. Give them swords only for this encounter.
    if ((LKN_PhysicalClash != Patch_LivingKhorinis_Dispatched) &&
        (Npc_GetDistToWP(cityScout,objective) < 1200) && (Npc_GetDistToWP(onarScout,objective) < 1200) &&
        (Npc_GetDistToNpc(cityScout,hero) < 2600) && (Npc_GetDistToNpc(onarScout,hero) < 2600)) {
        LKN_PhysicalClash = Patch_LivingKhorinis_Dispatched;
        prior = other;
        if (Npc_HasItems(cityScout,ItMw_1H_Mil_Sword) == 0) { CreateInvItems(cityScout,ItMw_1H_Mil_Sword,1); };
        if (Npc_HasItems(onarScout,ItMw_1H_Mil_Sword) == 0) { CreateInvItems(onarScout,ItMw_1H_Mil_Sword,1); };
        AI_EquipBestMeleeWeapon(cityScout);
        AI_EquipBestMeleeWeapon(onarScout);
        other = onarScout;
        B_Attack(cityScout,onarScout,AR_NONE,0);
        other = cityScout;
        B_Attack(onarScout,cityScout,AR_NONE,0);
        other = prior;
    };
};

func void LKN_RidgeUpdate() {
    var C_NPC guard;
    if (LKN_VisibleRidge == Patch_LivingKhorinis_RidgeOwner) { return; };
    guard = Hlp_GetNpc(LKN_Ridge);
    if (!Hlp_IsValidNpc(guard)) { return; };
    if (Patch_LivingKhorinis_RidgeOwner == Patch_LivingKhorinis_Militia) {
        guard.name[0] = LKN_MilitiaName;
        B_SetNpcVisual(guard,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Mil_L);
        Npc_RemoveInvItems(guard,ItAr_Sld_L,1);
    } else {
        guard.name[0] = LKN_MercenaryName;
        B_SetNpcVisual(guard,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
        Npc_RemoveInvItems(guard,ItAr_Mil_L,1);
    };
    LKN_VisibleRidge = Patch_LivingKhorinis_RidgeOwner;
};

func void LKN_Refresh() {
    var int today;
    var C_NPC guard;
    if (LKN_Busy != 0) { return; };
    LKN_Busy = 1;
    today = Wld_GetDay();
    if (LKN_Initialized == 0) {
        Patch_LivingKhorinis_Begin(today);
        LKN_LastDeliveryDay = today - 1;
        LKN_Initialized = 1;
    };
    Patch_LivingKhorinis_Advance(today);
    // A persistent new post actor represents the currently assigned lookout.
    // Avoid Wld_RemoveNpc: OpenGothic retains removed NPC handles in its symbol
    // table for a while, so changing physical instances here corrupts lookups.
    if (LKN_VisibleOwner != Patch_LivingKhorinis_Owner) {
        guard = Hlp_GetNpc(LKN_PostGuard);
        if (Hlp_IsValidNpc(guard)) {
            if (Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Militia) {
                guard.name[0] = LKN_MilitiaName;
                B_SetNpcVisual(guard, MALE, "Hum_Head_Bald", Face_N_Normal01, BodyTex_N, ItAr_Mil_L);
                Npc_RemoveInvItems(guard, ItAr_Sld_L, 1);
                Npc_RemoveInvItems(guard, ItAr_Bau_M, 1);
            } else if (Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Mercenaries) {
                guard.name[0] = LKN_MercenaryName;
                B_SetNpcVisual(guard, MALE, "Hum_Head_Fighter", Face_N_Normal01, BodyTex_N, ItAr_Sld_L);
                Npc_RemoveInvItems(guard, ItAr_Mil_L, 1);
                Npc_RemoveInvItems(guard, ItAr_Bau_M, 1);
            } else {
                guard.name[0] = LKN_NeutralName;
                B_SetNpcVisual(guard, MALE, "Hum_Head_Bald", Face_N_Normal01, BodyTex_N, ItAr_Bau_M);
            };
            LKN_VisibleOwner = Patch_LivingKhorinis_Owner;
        };
    };
    LKN_RidgeUpdate();
    LKN_ConstructionVisuals();
    LKN_IndustryVisuals();
    LKN_RoadOrders();
    LKN_Busy = 0;
};

func void ZS_LKN_Quartermaster() {
    Perception_Set_Normal();
    AI_SetWalkMode(self, NPC_WALK);
    AI_GotoWP(self, self.wp);
};

func int ZS_LKN_Quartermaster_Loop() {
    LKN_Refresh();
    AI_Wait(self, 2);
    return LOOP_CONTINUE;
};

func void ZS_LKN_Quartermaster_End() {};

func void LKN_TA_Quartermaster() {
    TA_Min(self, 6, 0, 18, 0, ZS_LKN_Quartermaster, LKN_QuartermasterPost);
    TA_Min(self, 18, 0, 6, 0, ZS_LKN_Quartermaster, LKN_QuartermasterPost);
};

instance LKN_Quartermaster(Npc_Default) {
    id = 61031;
    name[0] = "Marek, road quartermaster";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self, 2);
    B_SetNpcVisual(self, MALE, "Hum_Head_Bald", Face_N_Normal01, BodyTex_N, ItAr_Bau_M);
    daily_routine = LKN_TA_Quartermaster;
};

func void LKN_OnWorldInit() {
    var C_NPC previousSelf;
    var C_NPC previousOther;
    var C_NPC quartermaster;
    previousSelf = self;
    previousOther = other;
    // A save can contain already-instantiated NPCs. Never insert blind.
    LKN_Busy = 0;
    quartermaster = Hlp_GetNpc(LKN_PostGuard);
    if (!Hlp_IsValidNpc(quartermaster)) {
        LKN_VisibleOwner = 0;
        Wld_InsertNpc(LKN_PostGuard, LKN_RoadPost);
    };
    quartermaster = Hlp_GetNpc(LKN_Quartermaster);
    if (!Hlp_IsValidNpc(quartermaster)) {
        Wld_InsertNpc(LKN_Quartermaster, LKN_QuartermasterPost);
    };
    quartermaster = Hlp_GetNpc(LKN_Ridge);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_Ridge,LKN_RidgeWP); };
    quartermaster = Hlp_GetNpc(LKN_Gate);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_Gate,LKN_GateWP); };
    quartermaster = Hlp_GetNpc(LKN_OnarWorker);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_OnarWorker,LKN_OnarWorkerWP); };
    quartermaster = Hlp_GetNpc(LKN_SekobWorker);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_SekobWorker,LKN_SekobWorkerWP); };
    quartermaster = Hlp_GetNpc(LKN_BengarWorker);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_BengarWorker,LKN_BengarWorkerWP); };
    quartermaster = Hlp_GetNpc(LKN_FreeFarmer);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_FreeFarmer,LKN_FreeFarmerWP); };
    quartermaster = Hlp_GetNpc(LKN_FireNovice);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_FireNovice,LKN_FireNoviceWP); };
    quartermaster = Hlp_GetNpc(LKN_CityScout);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_CityScout,LKN_CityScoutWP); };
    quartermaster = Hlp_GetNpc(LKN_OnarScout);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_OnarScout,LKN_OnarScoutWP); };
    quartermaster = Hlp_GetNpc(LKN_DockGuard);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_DockGuard,LKN_DockWP); LKN_VisibleDock = 0; };
    quartermaster = Hlp_GetNpc(LKN_MineGuard);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_MineGuard,LKN_MineWP); LKN_VisibleMine = 0; };
    quartermaster = Hlp_GetNpc(LKN_DockWorker);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_DockWorker,LKN_DockWorkWP); };
    quartermaster = Hlp_GetNpc(LKN_MineWorker);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_MineWorker,LKN_MineWorkWP); };
    LKN_Refresh();
    self = previousSelf;
    other = previousOther;
};

func void LKN_OnAddonInit() {
    var C_NPC previousSelf;
    var C_NPC previousOther;
    var C_NPC novice;
    previousSelf = self;
    previousOther = other;
    novice = Hlp_GetNpc(LKN_WaterNovice);
    if (!Hlp_IsValidNpc(novice)) { Wld_InsertNpc(LKN_WaterNovice,LKN_WaterNoviceWP); };
    self = previousSelf;
    other = previousOther;
};

func int LKN_Always() { return TRUE; };

func void LKN_Report() {
    LKN_Refresh();
    if (Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Militia) {
        Print("Dead Harpy crossing: Khorinis militia holds the post.");
    } else if (Patch_LivingKhorinis_Owner == Patch_LivingKhorinis_Mercenaries) {
        Print("Dead Harpy crossing: Onar's mercenaries hold the post.");
    } else {
        Print("Dead Harpy crossing: the lookout is neutral.");
    };
};

func int LKN_CanDeliver() {
    if (LKN_LastDeliveryDay >= Wld_GetDay()) { return FALSE; };
    if (Npc_HasItems(other, ItFo_Bread) < 1) { return FALSE; };
    return TRUE;
};

func void LKN_Deliver(var int side) {
    var int today;
    LKN_Refresh();
    today = Wld_GetDay();
    if (Patch_LivingKhorinis_Day < today) { return; };
    if (!LKN_CanDeliver()) { return; };
    if (side == Patch_LivingKhorinis_Militia) {
        if (Patch_LivingKhorinis_MilitiaSupply >= 100) {
            Print("The militia supply store is full.");
            return;
        };
    } else {
        if (Patch_LivingKhorinis_MercenarySupply >= 100) {
            Print("The mercenary supply store is full.");
            return;
        };
    };
    Npc_RemoveInvItems(other, ItFo_Bread, 1);
    LKN_LastDeliveryDay = today;
    Patch_LivingKhorinis_Deliver(side);
    Print("Your provisions were delivered.");
};

func void LKN_DeliverMilitia() { LKN_Deliver(Patch_LivingKhorinis_Militia); };
func void LKN_DeliverMercenaries() { LKN_Deliver(Patch_LivingKhorinis_Mercenaries); };
func void LKN_Leave() { AI_StopProcessInfos(self); };

instance DIA_LKN_Report(C_INFO) {
    npc = LKN_Quartermaster;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Report;
    description = "Who holds the road?";
};

instance DIA_LKN_Militia(C_INFO) {
    npc = LKN_Quartermaster;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanDeliver;
    information = LKN_DeliverMilitia;
    description = "Send the militia provisions (1 bread).";
};

instance DIA_LKN_Mercenaries(C_INFO) {
    npc = LKN_Quartermaster;
    nr = 12;
    permanent = TRUE;
    condition = LKN_CanDeliver;
    information = LKN_DeliverMercenaries;
    description = "Send the mercenaries provisions (1 bread).";
};

instance DIA_LKN_Leave(C_INFO) {
    npc = LKN_Quartermaster;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = "Leave.";
};

func string LKN_StockLine(var string faction, var int wood, var int iron, var int gold, var int food, var int troops) {
    var string line;
    line = ConcatStrings(faction," L/I/G/F: ");
    line = ConcatStrings(line,IntToString(wood));
    line = ConcatStrings(line,"/");
    line = ConcatStrings(line,IntToString(iron));
    line = ConcatStrings(line,"/");
    line = ConcatStrings(line,IntToString(gold));
    line = ConcatStrings(line,"/");
    line = ConcatStrings(line,IntToString(food));
    line = ConcatStrings(line," Units: ");
    return ConcatStrings(line,IntToString(troops));
};
func void LKN_Stocks() {
    LKN_Refresh();
    Print(LKN_StockLine("Khorinis",Patch_LivingKhorinis_MilitiaWood,Patch_LivingKhorinis_MilitiaIron,Patch_LivingKhorinis_MilitiaGold,Patch_LivingKhorinis_MilitiaSupply,Patch_LivingKhorinis_MilitiaTroops));
    Print(LKN_StockLine("Onar",Patch_LivingKhorinis_MercenaryWood,Patch_LivingKhorinis_MercenaryIron,Patch_LivingKhorinis_MercenaryGold,Patch_LivingKhorinis_MercenarySupply,Patch_LivingKhorinis_MercenaryTroops));
    Print(LKN_StockLine("Akil",Patch_LivingKhorinis_FreeWood,Patch_LivingKhorinis_FreeIron,Patch_LivingKhorinis_FreeGold,Patch_LivingKhorinis_FreeSupply,Patch_LivingKhorinis_FreeTroops));
    Print(LKN_StockLine("Fire order",Patch_LivingKhorinis_FireWood,Patch_LivingKhorinis_FireIron,Patch_LivingKhorinis_FireGold,Patch_LivingKhorinis_FireSupply,Patch_LivingKhorinis_FireTroops));
    Print(LKN_StockLine("Water order",Patch_LivingKhorinis_WaterWood,Patch_LivingKhorinis_WaterIron,Patch_LivingKhorinis_WaterGold,Patch_LivingKhorinis_WaterSupply,Patch_LivingKhorinis_WaterTroops));
};
instance DIA_LKN_Stocks(C_INFO) {
    npc = LKN_Quartermaster;
    nr = 13;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Stocks;
    description = "Show supplies of the factions.";
};

func string LKN_IndustryLine(var string place, var int side, var int closed) {
    var string line;
    if (side == Patch_LivingKhorinis_Militia) { line = ConcatStrings(place,": Khorinis paladins"); }
    else { line = ConcatStrings(place,": Onar's mercenaries"); };
    if (closed == 1) { return ConcatStrings(line,"; shift suspended."); };
    return line;
};
func void LKN_IndustryReport() {
    LKN_Refresh();
    Print(LKN_IndustryLine("Harbour timber depot",Patch_LivingKhorinis_DockOwner,Patch_LivingKhorinis_DockClosed));
    Print(LKN_IndustryLine("Old mine camp",Patch_LivingKhorinis_MineOwner,Patch_LivingKhorinis_MineClosed));
};
instance DIA_LKN_IndustryReport(C_INFO) {
    npc = LKN_Quartermaster;
    nr = 14;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_IndustryReport;
    description = "Who holds the timber depot and mine?";
};
