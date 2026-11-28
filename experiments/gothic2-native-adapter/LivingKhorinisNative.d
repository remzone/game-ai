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
    npctype = NPCTYPE_MAIN;
    flags = 0;
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
    npctype = NPCTYPE_MAIN;
    flags = 0;
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
    flags = 0;
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
    flags = 0;
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
    flags = 0;
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
    flags = 0;
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
    flags = 0;
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
    flags = 0;
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
    flags = 0;
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
    flags = 0;
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
    flags = 0;
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
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Mil_L);
    daily_routine = LKN_TA_CrossReserve;
};
instance LKN_RidgeReserve(Npc_Default) {
    id = 61045;
    name[0] = "Ridge garrison soldier";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
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
const string LKN_MineWorkWP = "NW_CASTLEMINE_PATH_OUTSIDEHUT_02";
const string LKN_LoyalPaladin = "Paladin of the supply watch";
const string LKN_OreMercenary = "Mercenary of the supply watch";
var int LKN_DockPlaced;
var int LKN_MinePlaced;
var int LKN_VisibleDock;
var int LKN_VisibleMine;

instance LKN_DockBuilding(C_Item) {
    name = "Harbour timber depot building";
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
    npctype = NPCTYPE_MAIN;
    flags = 0;
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
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    daily_routine = LKN_TA_MineGuard;
};
var int LKN_DockBenchPlaced;
var int LKN_OreVeinPlaced;
instance LKN_DockBench(C_Item) {
    name = "Saw bench and logs";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_LOGS.3DS";
    value = 0;
};
instance LKN_OreVein(C_Item) {
    name = "Exposed iron vein";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_STONE;
    visual = "LKN_ORE.3DS";
    value = 0;
};
func void ZS_LKN_Sawyer() {
    Perception_Set_Normal();
    AI_SetWalkMode(self,NPC_WALK);
    AI_GotoWP(self,self.wp);
};
func int ZS_LKN_Sawyer_Loop() {
    LKN_Refresh();
    if ((Patch_LivingKhorinis_DockClosed == 0) && Wld_IsMobAvailable(self,"BAUMSAEGE")) {
        AI_UseMob(self,"BAUMSAEGE",1);
    } else if (Hlp_StrCmp(Npc_GetDetectedMob(self),"BAUMSAEGE")) {
        AI_UseMob(self,"BAUMSAEGE",-1);
    };
    AI_Wait(self,2);
    return LOOP_CONTINUE;
};
func void ZS_LKN_Sawyer_End() { AI_UseMob(self,"BAUMSAEGE",-1); };
func void ZS_LKN_Miner() {
    Perception_Set_Normal();
    AI_SetWalkMode(self,NPC_WALK);
    AI_GotoWP(self,self.wp);
    if (Npc_HasItems(self,ItMw_2H_Axe_L_01) == 0) { CreateInvItems(self,ItMw_2H_Axe_L_01,1); };
    EquipItem(self,ItMw_2H_Axe_L_01);
};
func int ZS_LKN_Miner_Loop() {
    LKN_Refresh();
    if (Patch_LivingKhorinis_MineClosed == 0) {
        if (Wld_IsMobAvailable(self,"ORE")) { AI_UseMob(self,"ORE",1); }
        else { AI_PlayAni(self,"T_ORE_S0_2_S1"); };
    } else if (Hlp_StrCmp(Npc_GetDetectedMob(self),"ORE")) { AI_UseMob(self,"ORE",-1); };
    AI_Wait(self,2);
    return LOOP_CONTINUE;
};
func void ZS_LKN_Miner_End() { AI_UseMob(self,"ORE",-1); };
func void LKN_TA_DockWorker() {
    // Second shift: do not reserve the saw while the stock harbour worker is using it.
    TA_Stand_WP(4,40,19,20,LKN_DockWorkWP);
    TA_Min(self,19,20,4,40,ZS_LKN_Sawyer,LKN_DockWorkWP);
};
instance LKN_DockWorker(Npc_Default) {
    id = 61048;
    name[0] = "Jan, harbour sawyer";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_DockWorker;
};
func void LKN_TA_MineWorker() {
    TA_Min(self,8,0,18,0,ZS_LKN_Miner,LKN_MineWorkWP);
    TA_Stand_WP(18,0,8,0,LKN_MineWorkWP);
};
instance LKN_MineWorker(Npc_Default) {
    id = 61049;
    name[0] = "Mikkel, ore miner";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
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
    if (LKN_DockBenchPlaced == 0) { Wld_InsertItem(LKN_DockBench,LKN_DockWorkWP); LKN_DockBenchPlaced = 1; };
    if (LKN_OreVeinPlaced == 0) { Wld_InsertItem(LKN_OreVein,LKN_MineWorkWP); LKN_OreVeinPlaced = 1; };
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

const string LKN_LobartDepot = "NW_FARM1_OUT_05";
const string LKN_CityDepot = "NW_CITY_ENTRANCE_01";
const string LKN_OnarDepot = "NW_BIGFARM_PATH_01";
const string LKN_FortWP = "NW_FARM1_PATH_CITY_19_B";
const string LKN_RaidStartWP = "NW_FARM1_PATH_CITY_SHEEP_09";
const string LKN_WP_ForestCamp = "NW_TAVERNE_TROLLAREA_08";
const string LKN_WP_BridgeCamp = "NW_FARM2_PATH_01_B";
const string LKN_WP_RiverCamp = "NW_FARM3_PATH_11_SMALLRIVER_02";
const string LKN_WP_LighthouseRoad = "NW_CITY_TO_LIGHTHOUSE_03";
const string LKN_WP_FarmRoad = "NW_FARM1_OUT_05";
const string LKN_WP_XardasRoad = "NW_XARDAS_TOWER_PATH_01";
const string LKN_WP_TavernRoad = "NW_TAVERNE_OUT_01";
const string LKN_WP_ValleyRoad = "NW_TO_PASS_01";
const string LKN_WP_ValleyGate = "NW_PASS_GATE_02";
func string LKN_SupplyDestination(var int route) {
    if (route == 1) { return LKN_RoadPost; };
    if (route == 2) { return LKN_RidgeWP; };
    if (route == 3) { return LKN_DockWP; };
    if (route == 5) { return LKN_FortWP; };
    if (route == 6) { return LKN_WP_ForestCamp; };
    if (route == 7) { return LKN_WP_BridgeCamp; };
    if (route == 8) { return LKN_WP_RiverCamp; };
    if (route == 9) { return LKN_WP_LighthouseRoad; };
    if (route == 10) { return LKN_WP_FarmRoad; };
    if (route == 11) { return LKN_WP_XardasRoad; };
    if (route == 12) { return LKN_WP_TavernRoad; };
    if (route == 13) { return LKN_WP_ValleyRoad; };
    if (route == 14) { return LKN_WP_ValleyGate; };
    return LKN_MineWP;
};
func string LKN_FreightGoal(var int who) {
    if (who == 61050) {
        if (Patch_LivingKhorinis_LobartCart > 0) { return LKN_CityDepot; };
        return LKN_LobartDepot;
    };
    if (who == 61051) {
        if (Patch_LivingKhorinis_OnarCart > 0) { return LKN_OnarDepot; };
        return LKN_OnarWorkerWP;
    };
    if (who == 61052) {
        if (Patch_LivingKhorinis_SekobCart > 0) { return LKN_OnarDepot; };
        return LKN_SekobWorkerWP;
    };
    if (who == 61053) {
        if (Patch_LivingKhorinis_BengarCart > 0) { return LKN_OnarDepot; };
        return LKN_BengarWorkerWP;
    };
    if (who <= 61056) {
        if (Patch_LivingKhorinis_CityCargo > 0) { return LKN_SupplyDestination(Patch_LivingKhorinis_CityRoute); };
        return LKN_CityDepot;
    };
    if (Patch_LivingKhorinis_MercCargo > 0) { return LKN_SupplyDestination(Patch_LivingKhorinis_MercRoute); };
    return LKN_OnarDepot;
};
func void ZS_LKN_Freight() {
    Perception_Set_Normal();
    AI_SetWalkMode(self,NPC_WALK);
};
func int ZS_LKN_Freight_Loop() {
    var string goal;
    LKN_Refresh();
    goal = LKN_FreightGoal(self.id);
    if (Npc_GetDistToWP(self,goal) > 220) { AI_GotoWP(self,goal); };
    AI_Wait(self,3);
    return LOOP_CONTINUE;
};
func void ZS_LKN_Freight_End() {};

func void LKN_TA_LobartPorter() {
    TA_Min(self,6,0,18,0,ZS_LKN_Freight,LKN_LobartDepot);
    TA_Min(self,18,0,6,0,ZS_LKN_Freight,LKN_LobartDepot);
};
instance LKN_LobartPorter(Npc_Default) {
    id = 61050;
    name[0] = "Martin, Lobart farm carrier";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_LobartPorter;
};

func void LKN_TA_OnarPorter() {
    TA_Min(self,6,0,18,0,ZS_LKN_Freight,LKN_OnarWorkerWP);
    TA_Min(self,18,0,6,0,ZS_LKN_Freight,LKN_OnarWorkerWP);
};
instance LKN_OnarPorter(Npc_Default) {
    id = 61051;
    name[0] = "Gunnar, Onar farm carrier";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_OnarPorter;
};

func void LKN_TA_SekobPorter() {
    TA_Min(self,6,0,18,0,ZS_LKN_Freight,LKN_SekobWorkerWP);
    TA_Min(self,18,0,6,0,ZS_LKN_Freight,LKN_SekobWorkerWP);
};
instance LKN_SekobPorter(Npc_Default) {
    id = 61052;
    name[0] = "Erik, Sekob farm carrier";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_SekobPorter;
};

func void LKN_TA_BengarPorter() {
    TA_Min(self,6,0,18,0,ZS_LKN_Freight,LKN_BengarWorkerWP);
    TA_Min(self,18,0,6,0,ZS_LKN_Freight,LKN_BengarWorkerWP);
};
instance LKN_BengarPorter(Npc_Default) {
    id = 61053;
    name[0] = "Rolf, Bengar farm carrier";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_BengarPorter;
};

func void LKN_TA_CitySupplyLead() {
    TA_Min(self,6,0,18,0,ZS_LKN_Freight,LKN_CityDepot);
    TA_Min(self,18,0,6,0,ZS_LKN_Freight,LKN_CityDepot);
};
instance LKN_CitySupplyLead(Npc_Default) {
    id = 61054;
    name[0] = "Konrad, Khorinis provisions";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_CitySupplyLead;
};

func void LKN_TA_CitySupplyGuard() {
    TA_Min(self,6,0,18,0,ZS_LKN_Freight,LKN_CityDepot);
    TA_Min(self,18,0,6,0,ZS_LKN_Freight,LKN_CityDepot);
};
instance LKN_CitySupplyGuard(Npc_Default) {
    id = 61055;
    name[0] = "Adalmar, convoy paladin";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Pal_M);
    daily_routine = LKN_TA_CitySupplyGuard;
};

func void LKN_TA_CitySupplyRear() {
    TA_Min(self,6,0,18,0,ZS_LKN_Freight,LKN_CityDepot);
    TA_Min(self,18,0,6,0,ZS_LKN_Freight,LKN_CityDepot);
};
instance LKN_CitySupplyRear(Npc_Default) {
    id = 61056;
    name[0] = "Falk, convoy guard";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Mil_L);
    daily_routine = LKN_TA_CitySupplyRear;
};

func void LKN_TA_OnarSupplyLead() {
    TA_Min(self,6,0,18,0,ZS_LKN_Freight,LKN_OnarDepot);
    TA_Min(self,18,0,6,0,ZS_LKN_Freight,LKN_OnarDepot);
};
instance LKN_OnarSupplyLead(Npc_Default) {
    id = 61057;
    name[0] = "Gerold, Onar provisions";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_OnarSupplyLead;
};

func void LKN_TA_OnarSupplyGuard() {
    TA_Min(self,6,0,18,0,ZS_LKN_Freight,LKN_OnarDepot);
    TA_Min(self,18,0,6,0,ZS_LKN_Freight,LKN_OnarDepot);
};
instance LKN_OnarSupplyGuard(Npc_Default) {
    id = 61058;
    name[0] = "Ulrik, convoy mercenary";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    daily_routine = LKN_TA_OnarSupplyGuard;
};

func void LKN_TA_OnarSupplyRear() {
    TA_Min(self,6,0,18,0,ZS_LKN_Freight,LKN_OnarDepot);
    TA_Min(self,18,0,6,0,ZS_LKN_Freight,LKN_OnarDepot);
};
instance LKN_OnarSupplyRear(Npc_Default) {
    id = 61059;
    name[0] = "Sven, convoy guard";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    daily_routine = LKN_TA_OnarSupplyRear;
};


// Scripted prologue; its outcome never depends on the campaign simulation.
var int LKN_FortPlaced;
var int LKN_RaidStage;
var int LKN_RaidTicks;
instance LKN_GateFort(C_Item) {
    name = "Gate road fort";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_STONE;
    visual = "LKN_GATEFORT.3DS";
    value = 0;
};

func void ZS_LKN_FortCaptain() {
    Perception_Set_Normal();
    AI_SetWalkMode(self,NPC_WALK);
    AI_GotoWP(self,LKN_FortWP);
};
func int ZS_LKN_FortCaptain_Loop() {
    LKN_Refresh();
    LKN_RaidTick();
    AI_Wait(self,2);
    return LOOP_CONTINUE;
};
func void ZS_LKN_FortCaptain_End() {};
func void LKN_TA_FortCaptain() {
    TA_Min(self,6,0,18,0,ZS_LKN_FortCaptain,LKN_FortWP);
    TA_Min(self,18,0,6,0,ZS_LKN_FortCaptain,LKN_FortWP);
};
func void LKN_TA_FortGuard() {
    TA_Stand_Guarding(6,0,18,0,LKN_FortWP);
    TA_Stand_Guarding(18,0,6,0,LKN_FortWP);
};
func void LKN_TA_Raider() {
    TA_Stand_WP(6,0,18,0,LKN_RaidStartWP);
    TA_Stand_WP(18,0,6,0,LKN_RaidStartWP);
};
func void ZS_LKN_Retreat() {
    AI_RemoveWeapon(self);
    AI_SetWalkMode(self,NPC_RUN);
    if (self.id >= 61063) { AI_GotoWP(self,LKN_RaidStartWP); }
    else { AI_GotoWP(self,LKN_FortWP); };
};
func int ZS_LKN_Retreat_Loop() { return LOOP_END; };
func void ZS_LKN_Retreat_End() {};

instance LKN_FortCaptain(Npc_Default) {
    id = 61060;
    name[0] = "Bertold, captain of the Gate Fort";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Pal_M);
    B_SetFightSkills(self,35);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_FortCaptain;
};

instance LKN_FortGuardA(Npc_Default) {
    id = 61061;
    name[0] = "Wulf, Gate Fort paladin";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Pal_M);
    attribute[ATR_STRENGTH] = 62;
    attribute[ATR_HITPOINTS_MAX] = 170;
    attribute[ATR_HITPOINTS] = 170;
    B_SetFightSkills(self,46);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Pal_Sword);
    daily_routine = LKN_TA_FortGuard;
};

instance LKN_FortGuardB(Npc_Default) {
    id = 61062;
    name[0] = "Odo, Gate Fort guard";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Mil_L);
    attribute[ATR_STRENGTH] = 54;
    attribute[ATR_HITPOINTS_MAX] = 145;
    attribute[ATR_HITPOINTS] = 145;
    B_SetFightSkills(self,46);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_FortGuard;
};

instance LKN_RaiderA(Npc_Default) {
    id = 61063;
    name[0] = "Einar, Onar raider";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    B_SetFightSkills(self,35);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_Raider;
};

instance LKN_RaiderB(Npc_Default) {
    id = 61064;
    name[0] = "Knut, Onar raider";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    B_SetFightSkills(self,35);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_Raider;
};

instance LKN_RaiderC(Npc_Default) {
    id = 61065;
    name[0] = "Torben, Onar raider";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    B_SetFightSkills(self,35);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_Raider;
};

func void ZS_LKN_FortSteward() {
    Perception_Set_Normal();
    AI_SetWalkMode(self,NPC_WALK);
    AI_GotoWP(self,LKN_FortWP);
};
func int ZS_LKN_FortSteward_Loop() {
    var C_NPC captain;
    LKN_Refresh();
    captain = Hlp_GetNpc(LKN_FortCaptain);
    if ((!Hlp_IsValidNpc(captain)) || Npc_IsDead(captain)) { LKN_RaidTick(); };
    AI_Wait(self,2);
    return LOOP_CONTINUE;
};
func void ZS_LKN_FortSteward_End() {};
func void LKN_TA_FortSteward() {
    TA_Min(self,6,0,18,0,ZS_LKN_FortSteward,LKN_FortWP);
    TA_Min(self,18,0,6,0,ZS_LKN_FortSteward,LKN_FortWP);
};
instance LKN_FortSteward(Npc_Default) {
    id = 61066;
    name[0] = "Emil, fort carpenter";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_FortSteward;
};

func void LKN_FortInit() {
    var C_NPC oldSelf;
    var C_NPC oldOther;
    oldSelf = self;
    oldOther = other;
    if (LKN_FortPlaced == 0) { Wld_InsertItem(LKN_GateFort,LKN_FortWP); LKN_FortPlaced = 1; };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_FortCaptain))) { Wld_InsertNpc(LKN_FortCaptain,LKN_FortWP); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_FortGuardA))) { Wld_InsertNpc(LKN_FortGuardA,LKN_FortWP); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_FortGuardB))) { Wld_InsertNpc(LKN_FortGuardB,LKN_FortWP); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_FortSteward))) { Wld_InsertNpc(LKN_FortSteward,LKN_FortWP); };
    self = oldSelf;
    other = oldOther;
};
func void LKN_RaidPair(var C_NPC raider,var C_NPC guard) {
    var C_NPC oldOther;
    if ((!Hlp_IsValidNpc(raider)) || (!Hlp_IsValidNpc(guard))) { return; };
    if (Npc_IsDead(raider) || Npc_IsDead(guard)) { return; };
    oldOther = other;
    Npc_ClearAIQueue(raider);
    Npc_ClearAIQueue(guard);
    other = guard;
    B_Attack(raider,guard,AR_NONE,0);
    other = raider;
    B_Attack(guard,raider,AR_NONE,0);
    other = oldOther;
};
func void LKN_RaidLeave(var C_NPC actor) {
    if ((!Hlp_IsValidNpc(actor)) || Npc_IsDead(actor)) { return; };
    Npc_ClearAIQueue(actor);
    AI_StartState(actor,ZS_LKN_Retreat,1,"");
};
func void LKN_RaidTick() {
    var C_NPC oldSelf;
    var C_NPC oldOther;
    var C_NPC first;
    if (LKN_RaidStage == 3) { return; };
    if (LKN_RaidStage == 0) {
        if (Npc_GetDistToWP(hero,LKN_FortWP) > 1950) { return; };
        oldSelf = self;
        oldOther = other;
        LKN_RaidStage = 1;
        LKN_RaidTicks = 0;
        if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_RaiderA))) { Wld_InsertNpc(LKN_RaiderA,LKN_RaidStartWP); };
        if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_RaiderB))) { Wld_InsertNpc(LKN_RaiderB,LKN_RaidStartWP); };
        if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_RaiderC))) { Wld_InsertNpc(LKN_RaiderC,LKN_RaidStartWP); };
        self = oldSelf;
        other = oldOther;
        AI_SetWalkMode(Hlp_GetNpc(LKN_RaiderA),NPC_RUN);
        AI_SetWalkMode(Hlp_GetNpc(LKN_RaiderB),NPC_RUN);
        AI_SetWalkMode(Hlp_GetNpc(LKN_RaiderC),NPC_RUN);
        AI_GotoWP(Hlp_GetNpc(LKN_RaiderA),LKN_FortWP);
        AI_GotoWP(Hlp_GetNpc(LKN_RaiderB),LKN_FortWP);
        AI_GotoWP(Hlp_GetNpc(LKN_RaiderC),LKN_FortWP);
        Print("Gate Fort is under attack!");
        return;
    };
    LKN_RaidTicks = LKN_RaidTicks + 1;
    if (LKN_RaidStage == 1) {
        first = Hlp_GetNpc(LKN_RaiderA);
        if (LKN_RaidTicks < 7) {
            if ((!Hlp_IsValidNpc(first)) || (Npc_GetDistToWP(first,LKN_FortWP) > 750)) { return; };
        };
        LKN_RaidStage = 2;
        LKN_RaidTicks = 0;
        // The captain controls timing and stands reserve; the two line guards engage.
        LKN_RaidPair(Hlp_GetNpc(LKN_RaiderA),Hlp_GetNpc(LKN_FortGuardA));
        LKN_RaidPair(Hlp_GetNpc(LKN_RaiderB),Hlp_GetNpc(LKN_FortGuardB));
        // A third attacker joins the same melee without replacing the guard's current target.
        oldOther = other;
        other = Hlp_GetNpc(LKN_FortGuardA);
        if (Hlp_IsValidNpc(other) && (!Npc_IsDead(other)) && !Npc_IsDead(Hlp_GetNpc(LKN_RaiderC))) {
            B_Attack(Hlp_GetNpc(LKN_RaiderC),other,AR_NONE,0);
        };
        other = oldOther;
        return;
    };
    if (LKN_RaidTicks >= 12) {
        LKN_RaidStage = 3;
        Patch_LivingKhorinis_WarUnlocked = 1;
        LKN_RaidLeave(Hlp_GetNpc(LKN_RaiderA));
        LKN_RaidLeave(Hlp_GetNpc(LKN_RaiderB));
        LKN_RaidLeave(Hlp_GetNpc(LKN_RaiderC));
        LKN_RaidLeave(Hlp_GetNpc(LKN_FortGuardA));
        LKN_RaidLeave(Hlp_GetNpc(LKN_FortGuardB));
        if (Npc_GetDistToWP(hero,LKN_FortWP) < 4000) { Print("The paladins repelled the raid."); };
    };
};


func void LKN_TA_CityBlade() {
    TA_Stand_Guarding(6,0,18,0,LKN_CityScoutWP);
    TA_Stand_Guarding(18,0,6,0,LKN_CityScoutWP);
};
instance LKN_CityBlade(Npc_Default) {
    id = 61084;
    name[0] = "Edgar, Khorinis assault soldier";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,33);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_CityBlade;
};

func void LKN_TA_OnarBlade() {
    TA_Stand_Guarding(6,0,18,0,LKN_OnarScoutWP);
    TA_Stand_Guarding(18,0,6,0,LKN_OnarScoutWP);
};
instance LKN_OnarBlade(Npc_Default) {
    id = 61085;
    name[0] = "Valden, Onar assault soldier";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_SLD_L);
    B_SetFightSkills(self,33);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_OnarBlade;
};

func void LKN_OrderBlade(var C_NPC npc,var string objective) {
    if ((!Hlp_IsValidNpc(npc)) || Npc_IsDead(npc)) { return; };
    Npc_ClearAIQueue(npc);
    AI_GotoWP(npc,objective);
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
    if (Npc_IsDead(cityScout) || Npc_IsDead(onarScout)) { return; };
    side = Patch_LivingKhorinis_AttackSide;
    if (side == 0) {
        if (LKN_LastDispatch != 0) {
            LKN_LastDispatch = 0;
            Npc_ClearAIQueue(cityScout);
            Npc_ClearAIQueue(onarScout);
            AI_GotoWP(cityScout,LKN_CityScoutWP);
            AI_GotoWP(onarScout,LKN_OnarScoutWP);
            LKN_OrderBlade(Hlp_GetNpc(LKN_CityBlade),LKN_CityScoutWP);
            LKN_OrderBlade(Hlp_GetNpc(LKN_OnarBlade),LKN_OnarScoutWP);
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
        LKN_OrderBlade(Hlp_GetNpc(LKN_CityBlade),objective);
        LKN_OrderBlade(Hlp_GetNpc(LKN_OnarBlade),objective);
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
        LKN_RaidPair(Hlp_GetNpc(LKN_CityBlade),Hlp_GetNpc(LKN_OnarBlade));
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

func void LKN_UpdateCrewLosses() {
    var C_NPC hand;
    hand = Hlp_GetNpc(LKN_DockWorker);
    if (Hlp_IsValidNpc(hand) && Npc_IsDead(hand)) {
        Patch_LivingKhorinis_DockWorkerLost = 1;
        Patch_LivingKhorinis_DockClosed = 1;
    };
    hand = Hlp_GetNpc(LKN_MineWorker);
    if (Hlp_IsValidNpc(hand) && Npc_IsDead(hand)) {
        Patch_LivingKhorinis_MineWorkerLost = 1;
        Patch_LivingKhorinis_MineClosed = 1;
    };
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
    LKN_UpdateCrewLosses();
    LKN_UpdateCampLosses();
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
    LKN_MageOrders();
    LKN_RoadNetworkVisuals();
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
    flags = 0;
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
    if ((!Hlp_IsValidNpc(quartermaster)) && (Patch_LivingKhorinis_DockWorkerLost == 0)) { Wld_InsertNpc(LKN_DockWorker,LKN_DockWorkWP); };
    quartermaster = Hlp_GetNpc(LKN_MineWorker);
    if ((!Hlp_IsValidNpc(quartermaster)) && (Patch_LivingKhorinis_MineWorkerLost == 0)) { Wld_InsertNpc(LKN_MineWorker,LKN_MineWorkWP); };
    quartermaster = Hlp_GetNpc(LKN_LobartPorter);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_LobartPorter,LKN_LobartDepot); };
    quartermaster = Hlp_GetNpc(LKN_OnarPorter);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_OnarPorter,LKN_OnarWorkerWP); };
    quartermaster = Hlp_GetNpc(LKN_SekobPorter);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_SekobPorter,LKN_SekobWorkerWP); };
    quartermaster = Hlp_GetNpc(LKN_BengarPorter);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_BengarPorter,LKN_BengarWorkerWP); };
    quartermaster = Hlp_GetNpc(LKN_CitySupplyLead);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_CitySupplyLead,LKN_CityDepot); };
    quartermaster = Hlp_GetNpc(LKN_CitySupplyGuard);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_CitySupplyGuard,LKN_CityDepot); };
    quartermaster = Hlp_GetNpc(LKN_CitySupplyRear);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_CitySupplyRear,LKN_CityDepot); };
    quartermaster = Hlp_GetNpc(LKN_OnarSupplyLead);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_OnarSupplyLead,LKN_OnarDepot); };
    quartermaster = Hlp_GetNpc(LKN_OnarSupplyGuard);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_OnarSupplyGuard,LKN_OnarDepot); };
    quartermaster = Hlp_GetNpc(LKN_OnarSupplyRear);
    if (!Hlp_IsValidNpc(quartermaster)) { Wld_InsertNpc(LKN_OnarSupplyRear,LKN_OnarDepot); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_CityBlade))) { Wld_InsertNpc(LKN_CityBlade,LKN_CityScoutWP); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_OnarBlade))) { Wld_InsertNpc(LKN_OnarBlade,LKN_OnarScoutWP); };
    LKN_FortInit();
    LKN_CampInit();
    LKN_RoadNetworkInit();
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
    Print(ConcatStrings("Food (docks / mine): ",ConcatStrings(IntToString(Patch_LivingKhorinis_DockFood),ConcatStrings(" / ",IntToString(Patch_LivingKhorinis_MineFood)))));
};
instance DIA_LKN_IndustryReport(C_INFO) {
    npc = LKN_Quartermaster;
    nr = 14;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_IndustryReport;
    description = "Who holds the timber depot and mine?";
};

// Shared on-site dialogue. Choices are localized once, without replacing stock OU/voice archives.
const string LKN_AskPostText = "What is happening at this post?";
const string LKN_FeedPostText = "Give the post one bread (+5 rations).";
const string LKN_PriorityText = "Give this post priority for the next convoy.";
const string LKN_EndPostTalk = "End conversation.";
var int LKN_GiftCrossDay;
var int LKN_GiftRidgeDay;
var int LKN_GiftDockDay;
var int LKN_GiftMineDay;
var int LKN_GiftRoad6;
var int LKN_GiftRoad7;
var int LKN_GiftRoad8;
var int LKN_GiftRoad9;
var int LKN_GiftRoad10;
var int LKN_GiftRoad11;
var int LKN_GiftRoad12;
var int LKN_GiftRoad13;
var int LKN_GiftRoad14;
var int LKN_GiftGateDay;

func int LKN_SpeakerPost() {
    if (self.id == 61032) { return 1; };
    if (self.id == 61033) { return 2; };
    if ((self.id == 61046) || (self.id == 61048)) { return 3; };
    if ((self.id == 61047) || (self.id == 61049)) { return 4; };
    if (self.id == 61086) { return 6; };
    if (self.id == 61087) { return 7; };
    if (self.id == 61088) { return 8; };
    if (self.id == 61089) { return 9; };
    if (self.id == 61090) { return 10; };
    if (self.id == 61091) { return 11; };
    if (self.id == 61092) { return 12; };
    if (self.id == 61093) { return 13; };
    if (self.id == 61094) { return 14; };
    if (self.id == 61095) { return 14; };
    if (self.id == 61096) { return 14; };
    if (self.id == 61097) { return 14; };
    if (self.id == 61098) { return 14; };
    if (self.id == 61099) { return 14; };
    return 5;
};
func string LKN_PostJob(var int site) {
    if (site == 1) { return "We watch the crossroads. Whoever controls the road feeds the watch."; };
    if (site == 2) { return "The ridge guards the farm road. Fresh supplies keep the watch on duty."; };
    if (site == 3) { return "You will find Jan and the logs at the harbour sawbench. No rations, no timber."; };
    if (site == 4) { return "Mikkel works the vein beside the guard. Without rations we cannot dig."; };
    if (site >= 13) { return "The pass is garrisoned to keep the Mining Valley road closed to the orcs."; };
    if (site >= 9) { return "The road watch escorts supplies and protects the route for Khorinis."; };
    if (site >= 6) { return "Travelers shelter here. The camp changes hands when a faction can keep it supplied."; };
    if (LKN_RaidStage < 3) { return "Stay by the road. The watch has spotted mercenaries nearby."; };
    return "We held the fort. Food for the watch gives us a chance to hold it next time.";
};
func void LKN_Subtitle(var string line) {
    PrintScreen(line,-1,67,"FONT_OLD_10_WHITE.TGA",5);
};
func string LKN_RoadOwnerText(var int owner) {
    if (owner == 1) { return "Under Khorinis control."; };
    if (owner == 2) { return "Under Onar's control."; };
    if (owner == 4) { return "Held by the Fire Order."; };
    if (owner == 5) { return "Held by the Water Order."; };
    if (owner == 6) { return "Held by the Brotherhood."; };
    return "Still independent.";
};
func void LKN_PostSpeak() {
    var int site;
    LKN_Refresh();
    site = LKN_SpeakerPost();
    LKN_Subtitle(LKN_PostJob(site));
    if ((site >= 6) && (site <= 8)) { Print(LKN_RoadOwnerText(Patch_LivingKhorinis_PostOwner(site))); };
    Print(ConcatStrings("Post rations: ",IntToString(Patch_LivingKhorinis_PostFood(site))));
};
func int LKN_LastPostGift(var int site) {
    if (site == 1) { return LKN_GiftCrossDay; };
    if (site == 2) { return LKN_GiftRidgeDay; };
    if (site == 3) { return LKN_GiftDockDay; };
    if (site == 4) { return LKN_GiftMineDay; };
    if (site == 6) { return LKN_GiftRoad6; };
    if (site == 7) { return LKN_GiftRoad7; };
    if (site == 8) { return LKN_GiftRoad8; };
    if (site == 9) { return LKN_GiftRoad9; };
    if (site == 10) { return LKN_GiftRoad10; };
    if (site == 11) { return LKN_GiftRoad11; };
    if (site == 12) { return LKN_GiftRoad12; };
    if (site == 13) { return LKN_GiftRoad13; };
    if (site == 14) { return LKN_GiftRoad14; };
    return LKN_GiftGateDay;
};
func int LKN_CanFeedPost() {
    var int site;
    site = LKN_SpeakerPost();
    if (Npc_HasItems(other,ItFo_Bread) < 1) { return FALSE; };
    if (Patch_LivingKhorinis_PostFood(site) > 19) { return FALSE; };
    return LKN_LastPostGift(site) < Wld_GetDay()+1;
};
func void LKN_FeedPost() {
    var int site;
    var int today;
    var int owner;
    var int food;
    LKN_Refresh();
    if (!LKN_CanFeedPost()) { return; };
    site = LKN_SpeakerPost();
    today = Wld_GetDay()+1;
    owner = Patch_LivingKhorinis_PostOwner(site);
    food = Patch_LivingKhorinis_PostFood(site);
    Npc_RemoveInvItems(other,ItFo_Bread,1);
    Patch_LivingKhorinis_SetPostFood(site,food+5);
    if (site == 1) { LKN_GiftCrossDay = today; };
    if (site == 2) { LKN_GiftRidgeDay = today; };
    if (site == 3) { LKN_GiftDockDay = today; };
    if (site == 4) { LKN_GiftMineDay = today; };
    if (site == 5) { LKN_GiftGateDay = today; };
    if (site == 6) { LKN_GiftRoad6 = today; };
    if (site == 7) { LKN_GiftRoad7 = today; };
    if (site == 8) { LKN_GiftRoad8 = today; };
    if (site == 9) { LKN_GiftRoad9 = today; };
    if (site == 10) { LKN_GiftRoad10 = today; };
    if (site == 11) { LKN_GiftRoad11 = today; };
    if (site == 12) { LKN_GiftRoad12 = today; };
    if (site == 13) { LKN_GiftRoad13 = today; };
    if (site == 14) { LKN_GiftRoad14 = today; };
    if (owner == Patch_LivingKhorinis_Militia) {
        Patch_LivingKhorinis_CityStanding = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_CityStanding+1,4);
    } else if (owner == Patch_LivingKhorinis_Mercenaries) {
        Patch_LivingKhorinis_MercStanding = Patch_LivingKhorinis_Bounded(Patch_LivingKhorinis_MercStanding+1,4);
    };
    if ((site == 3) && (Patch_LivingKhorinis_DockWorkerLost == 0) && (!Patch_LivingKhorinis_Blocked(site))) {
        Patch_LivingKhorinis_DockClosed = 0;
    };
    if ((site == 4) && (Patch_LivingKhorinis_MineWorkerLost == 0) && (!Patch_LivingKhorinis_Blocked(site))) {
        Patch_LivingKhorinis_MineClosed = 0;
    };
    LKN_Subtitle("Thank you. We added your bread to the post's stores.");
};
func int LKN_CanRequestPost() {
    var int owner;
    var int site;
    site = LKN_SpeakerPost();
    owner = Patch_LivingKhorinis_PostOwner(site);
    if ((Patch_LivingKhorinis_PostFood(site) >= 16) || Patch_LivingKhorinis_Blocked(site)) { return FALSE; };
    if (owner == Patch_LivingKhorinis_Militia) {
        return (Patch_LivingKhorinis_CityStanding >= 1) && (Patch_LivingKhorinis_CityRequest != site);
    };
    if (owner == Patch_LivingKhorinis_Mercenaries) {
        return (Patch_LivingKhorinis_MercStanding >= 1) && (Patch_LivingKhorinis_MercRequest != site);
    };
    return FALSE;
};
func void LKN_RequestPost() {
    var int owner;
    var int site;
    if (!LKN_CanRequestPost()) { return; };
    site = LKN_SpeakerPost();
    owner = Patch_LivingKhorinis_PostOwner(site);
    if (owner == Patch_LivingKhorinis_Militia) { Patch_LivingKhorinis_CityRequest = site; };
    if (owner == Patch_LivingKhorinis_Mercenaries) { Patch_LivingKhorinis_MercRequest = site; };
    LKN_Subtitle("I have passed on the order. We get the next convoy if the road stays open.");
};

instance DIA_LKN_FortCaptain_Report(C_INFO) {
    npc = LKN_FortCaptain;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_FortCaptain_Bread(C_INFO) {
    npc = LKN_FortCaptain;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_FortCaptain_Convoy(C_INFO) {
    npc = LKN_FortCaptain;
    nr = 12;
    permanent = TRUE;
    condition = LKN_CanRequestPost;
    information = LKN_RequestPost;
    description = LKN_PriorityText;
};

instance DIA_LKN_FortCaptain_Leave(C_INFO) {
    npc = LKN_FortCaptain;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_FortSteward_Report(C_INFO) {
    npc = LKN_FortSteward;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_FortSteward_Bread(C_INFO) {
    npc = LKN_FortSteward;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_FortSteward_Convoy(C_INFO) {
    npc = LKN_FortSteward;
    nr = 12;
    permanent = TRUE;
    condition = LKN_CanRequestPost;
    information = LKN_RequestPost;
    description = LKN_PriorityText;
};

instance DIA_LKN_FortSteward_Leave(C_INFO) {
    npc = LKN_FortSteward;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_FortGuardA_Report(C_INFO) {
    npc = LKN_FortGuardA;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_FortGuardA_Bread(C_INFO) {
    npc = LKN_FortGuardA;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_FortGuardA_Leave(C_INFO) {
    npc = LKN_FortGuardA;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_FortGuardB_Report(C_INFO) {
    npc = LKN_FortGuardB;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_FortGuardB_Bread(C_INFO) {
    npc = LKN_FortGuardB;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_FortGuardB_Leave(C_INFO) {
    npc = LKN_FortGuardB;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_PostGuard_Report(C_INFO) {
    npc = LKN_PostGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_PostGuard_Bread(C_INFO) {
    npc = LKN_PostGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_PostGuard_Convoy(C_INFO) {
    npc = LKN_PostGuard;
    nr = 12;
    permanent = TRUE;
    condition = LKN_CanRequestPost;
    information = LKN_RequestPost;
    description = LKN_PriorityText;
};

instance DIA_LKN_PostGuard_Leave(C_INFO) {
    npc = LKN_PostGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_Ridge_Report(C_INFO) {
    npc = LKN_Ridge;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_Ridge_Bread(C_INFO) {
    npc = LKN_Ridge;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_Ridge_Convoy(C_INFO) {
    npc = LKN_Ridge;
    nr = 12;
    permanent = TRUE;
    condition = LKN_CanRequestPost;
    information = LKN_RequestPost;
    description = LKN_PriorityText;
};

instance DIA_LKN_Ridge_Leave(C_INFO) {
    npc = LKN_Ridge;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_DockGuard_Report(C_INFO) {
    npc = LKN_DockGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_DockGuard_Bread(C_INFO) {
    npc = LKN_DockGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_DockGuard_Convoy(C_INFO) {
    npc = LKN_DockGuard;
    nr = 12;
    permanent = TRUE;
    condition = LKN_CanRequestPost;
    information = LKN_RequestPost;
    description = LKN_PriorityText;
};

instance DIA_LKN_DockGuard_Leave(C_INFO) {
    npc = LKN_DockGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_MineGuard_Report(C_INFO) {
    npc = LKN_MineGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_MineGuard_Bread(C_INFO) {
    npc = LKN_MineGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_MineGuard_Convoy(C_INFO) {
    npc = LKN_MineGuard;
    nr = 12;
    permanent = TRUE;
    condition = LKN_CanRequestPost;
    information = LKN_RequestPost;
    description = LKN_PriorityText;
};

instance DIA_LKN_MineGuard_Leave(C_INFO) {
    npc = LKN_MineGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_DockWorker_Report(C_INFO) {
    npc = LKN_DockWorker;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_DockWorker_Bread(C_INFO) {
    npc = LKN_DockWorker;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_DockWorker_Leave(C_INFO) {
    npc = LKN_DockWorker;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_MineWorker_Report(C_INFO) {
    npc = LKN_MineWorker;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_MineWorker_Bread(C_INFO) {
    npc = LKN_MineWorker;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_MineWorker_Leave(C_INFO) {
    npc = LKN_MineWorker;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

const string LKN_WaterCampWP = "NW_TROLLAREA_PORTAL_KDWWAIT_01";
const string LKN_WaterPostWP = "NW_TROLLAREA_PORTAL_03";
const string LKN_SectCampWP = "NW_XARDAS_TOWER_LESTER";
const string LKN_FireHireWP = "NW_MONASTERY_ENTRY_01";
var int LKN_WaterCampPlaced;
var int LKN_SectCampPlaced;
var int LKN_FireWatchPlaced;
var int LKN_FireDonation;
var int LKN_WaterDonation;
var int LKN_SectDonation;
var int LKN_CaptainLost;
var int LKN_StewardLost;

instance LKN_WaterCampProp(C_Item) {
    name = "Water Magi expedition camp";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_WATER.3DS";
    value = 0;
};
instance LKN_WaterWatchProp(C_Item) {
    name = "Water sentry outpost";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_CROSS.3DS";
    value = 0;
};
instance LKN_SectCampProp(C_Item) {
    name = "Brotherhood shelter";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_SECT.3DS";
    value = 0;
};

func void LKN_TA_WaterMaster() {
    TA_Min(self,6,0,18,0,ZS_LKN_Quartermaster,LKN_WaterCampWP);
    TA_Min(self,18,0,6,0,ZS_LKN_Quartermaster,LKN_WaterCampWP);
};
instance LKN_WaterMaster(Npc_Default) {
    id = 61067;
    name[0] = "Nerian, Water Magus";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_KDW_H);
    daily_routine = LKN_TA_WaterMaster;
};

func void LKN_TA_WaterGuard1() {
    TA_Stand_Guarding(6,0,18,0,LKN_WaterPostWP);
    TA_Stand_Guarding(18,0,6,0,LKN_WaterPostWP);
};
instance LKN_WaterGuard1(Npc_Default) {
    id = 61068;
    name[0] = "Tarek, Water sentry";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_KDW_L_Addon);
    B_SetFightSkills(self,30);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_WaterGuard1;
};

func void LKN_TA_WaterGuard2() {
    TA_Stand_Guarding(6,0,18,0,"NW_TROLLAREA_PORTAL_KDWWAIT_04");
    TA_Stand_Guarding(18,0,6,0,"NW_TROLLAREA_PORTAL_KDWWAIT_04");
};
instance LKN_WaterGuard2(Npc_Default) {
    id = 61069;
    name[0] = "Ivar, Water sentry";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_KDW_L_Addon);
    B_SetFightSkills(self,30);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_WaterGuard2;
};

func void LKN_TA_WaterAcolyte1() {
    TA_Study_WP(6,0,18,0,"NW_TROLLAREA_PORTAL_KDWWAIT_05");
    TA_Study_WP(18,0,6,0,"NW_TROLLAREA_PORTAL_KDWWAIT_05");
};
instance LKN_WaterAcolyte1(Npc_Default) {
    id = 61070;
    name[0] = "Maren, Water acolyte";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_KDW_L_Addon);
    daily_routine = LKN_TA_WaterAcolyte1;
};

func void LKN_TA_WaterAcolyte2() {
    TA_Study_WP(6,0,18,0,"NW_TROLLAREA_PORTAL_KDWWAIT_06");
    TA_Study_WP(18,0,6,0,"NW_TROLLAREA_PORTAL_KDWWAIT_06");
};
instance LKN_WaterAcolyte2(Npc_Default) {
    id = 61071;
    name[0] = "Darin, Water acolyte";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_KDW_L_Addon);
    daily_routine = LKN_TA_WaterAcolyte2;
};

func void LKN_TA_SectMaster() {
    TA_Min(self,6,0,18,0,ZS_LKN_Quartermaster,LKN_SectCampWP);
    TA_Min(self,18,0,6,0,ZS_LKN_Quartermaster,LKN_SectCampWP);
};
instance LKN_SectMaster(Npc_Default) {
    id = 61072;
    name[0] = "Sorem, Brotherhood guru";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_NOV_L);
    daily_routine = LKN_TA_SectMaster;
};

func void LKN_TA_SectGuard() {
    TA_Stand_Guarding(6,0,18,0,LKN_SectCampWP);
    TA_Stand_Guarding(18,0,6,0,LKN_SectCampWP);
};
instance LKN_SectGuard(Npc_Default) {
    id = 61073;
    name[0] = "Varek, Brotherhood guard";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_BDT_M);
    B_SetFightSkills(self,30);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_SectGuard;
};

func void LKN_TA_SectNovice() {
    TA_Stand_WP(6,0,18,0,LKN_SectCampWP);
    TA_Stand_WP(18,0,6,0,LKN_SectCampWP);
};
instance LKN_SectNovice(Npc_Default) {
    id = 61074;
    name[0] = "Larik, Brotherhood novice";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_NOV_L);
    daily_routine = LKN_TA_SectNovice;
};

func void LKN_TA_CityFireMage() {
    TA_Stand_Guarding(6,0,18,0,LKN_FireHireWP);
    TA_Stand_Guarding(18,0,6,0,LKN_FireHireWP);
};
instance LKN_CityFireMage(Npc_Default) {
    id = 61075;
    name[0] = "Aurel, Khorinis Fire mage";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    fight_tactic = FAI_HUMAN_STRONG;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_KDF_L);
    attribute[ATR_MANA] = 78;
    attribute[ATR_MANA_MAX] = 78;
    CreateInvItems(self,ItRu_FireBolt,1);
    daily_routine = LKN_TA_CityFireMage;
};

func void LKN_TA_CityWaterMage() {
    TA_Stand_Guarding(6,0,18,0,"NW_TROLLAREA_PORTAL_KDWWAIT_02");
    TA_Stand_Guarding(18,0,6,0,"NW_TROLLAREA_PORTAL_KDWWAIT_02");
};
instance LKN_CityWaterMage(Npc_Default) {
    id = 61076;
    name[0] = "Nelvar, Khorinis Water mage";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    fight_tactic = FAI_HUMAN_STRONG;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_KDW_H);
    attribute[ATR_MANA] = 78;
    attribute[ATR_MANA_MAX] = 78;
    CreateInvItems(self,ItRu_Icelance,1);
    daily_routine = LKN_TA_CityWaterMage;
};

func void LKN_TA_OnarWaterMage() {
    TA_Stand_Guarding(6,0,18,0,"NW_TROLLAREA_PORTAL_KDWWAIT_03");
    TA_Stand_Guarding(18,0,6,0,"NW_TROLLAREA_PORTAL_KDWWAIT_03");
};
instance LKN_OnarWaterMage(Npc_Default) {
    id = 61078;
    name[0] = "Sevran, Onar Water mage";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    fight_tactic = FAI_HUMAN_STRONG;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_KDW_H);
    attribute[ATR_MANA] = 78;
    attribute[ATR_MANA_MAX] = 78;
    CreateInvItems(self,ItRu_Icelance,1);
    daily_routine = LKN_TA_OnarWaterMage;
};

func void LKN_TA_OnarSectMage() {
    TA_Stand_Guarding(6,0,18,0,LKN_SectCampWP);
    TA_Stand_Guarding(18,0,6,0,LKN_SectCampWP);
};
instance LKN_OnarSectMage(Npc_Default) {
    id = 61079;
    name[0] = "Koran, Brotherhood mercenary";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    fight_tactic = FAI_HUMAN_STRONG;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_NOV_L);
    attribute[ATR_MANA] = 78;
    attribute[ATR_MANA_MAX] = 78;
    CreateInvItems(self,ItRu_Sleep,1);
    daily_routine = LKN_TA_OnarSectMage;
};


instance LKN_FireWatchProp(C_Item) {
    name = "Fire monastery guardhouse";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_FIRE.3DS";
    value = 0;
};

func void LKN_TA_FireMaster() {
    TA_Min(self,6,0,18,0,ZS_LKN_Quartermaster,LKN_FireHireWP);
    TA_Min(self,18,0,6,0,ZS_LKN_Quartermaster,LKN_FireHireWP);
};
instance LKN_FireMaster(Npc_Default) {
    id = 61080;
    name[0] = "Albin, Fire Magus";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_KDF_L);
    daily_routine = LKN_TA_FireMaster;
};

func void LKN_TA_FireGuard1() {
    TA_Stand_Guarding(6,0,18,0,LKN_FireHireWP);
    TA_Stand_Guarding(18,0,6,0,LKN_FireHireWP);
};
instance LKN_FireGuard1(Npc_Default) {
    id = 61081;
    name[0] = "Raban, monastery guard";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,30);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_FireGuard1;
};

func void LKN_TA_FireGuard2() {
    TA_Stand_Guarding(6,0,18,0,LKN_FireHireWP);
    TA_Stand_Guarding(18,0,6,0,LKN_FireHireWP);
};
instance LKN_FireGuard2(Npc_Default) {
    id = 61082;
    name[0] = "Silas, monastery guard";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,30);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_FireGuard2;
};

func void LKN_TA_SectGuard2() {
    TA_Stand_Guarding(6,0,18,0,LKN_SectCampWP);
    TA_Stand_Guarding(18,0,6,0,LKN_SectCampWP);
};
instance LKN_SectGuard2(Npc_Default) {
    id = 61083;
    name[0] = "Yorik, Brotherhood guard";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Psionic",Face_N_Normal01,BodyTex_N,ITAR_BDT_M);
    B_SetFightSkills(self,30);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_SectGuard2;
};
func void LKN_CampInit() {
    var C_NPC previousSelf;
    var C_NPC previousOther;
    previousSelf = self;
    previousOther = other;
    if (LKN_WaterCampPlaced == 0) {
        Wld_InsertItem(LKN_WaterCampProp,LKN_WaterCampWP);
        Wld_InsertItem(LKN_WaterWatchProp,LKN_WaterPostWP);
        LKN_WaterCampPlaced = 1;
    };
    if (LKN_SectCampPlaced == 0) { Wld_InsertItem(LKN_SectCampProp,LKN_SectCampWP); LKN_SectCampPlaced = 1; };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_WaterMaster))) && Patch_LivingKhorinis_WaterCampLost == 0) { Wld_InsertNpc(LKN_WaterMaster,LKN_WaterCampWP); };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_WaterGuard1)))) { Wld_InsertNpc(LKN_WaterGuard1,LKN_WaterPostWP); };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_WaterGuard2)))) { Wld_InsertNpc(LKN_WaterGuard2,"NW_TROLLAREA_PORTAL_KDWWAIT_04"); };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_WaterAcolyte1)))) { Wld_InsertNpc(LKN_WaterAcolyte1,"NW_TROLLAREA_PORTAL_KDWWAIT_05"); };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_WaterAcolyte2)))) { Wld_InsertNpc(LKN_WaterAcolyte2,"NW_TROLLAREA_PORTAL_KDWWAIT_06"); };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_SectMaster))) && Patch_LivingKhorinis_SectCampLost == 0) { Wld_InsertNpc(LKN_SectMaster,LKN_SectCampWP); };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_SectGuard)))) { Wld_InsertNpc(LKN_SectGuard,LKN_SectCampWP); };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_SectNovice)))) { Wld_InsertNpc(LKN_SectNovice,LKN_SectCampWP); };
    if (LKN_FireWatchPlaced == 0) { Wld_InsertItem(LKN_FireWatchProp,LKN_FireHireWP); LKN_FireWatchPlaced = 1; };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_FireMaster))) && Patch_LivingKhorinis_FireCampLost == 0) { Wld_InsertNpc(LKN_FireMaster,LKN_FireHireWP); };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_FireGuard1)))) { Wld_InsertNpc(LKN_FireGuard1,LKN_FireHireWP); };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_FireGuard2)))) { Wld_InsertNpc(LKN_FireGuard2,LKN_FireHireWP); };
    if ((!Hlp_IsValidNpc(Hlp_GetNpc(LKN_SectGuard2)))) { Wld_InsertNpc(LKN_SectGuard2,LKN_SectCampWP); };
    self = previousSelf;
    other = previousOther;
};

func int LKN_CampActorDead(var C_NPC actor) {
    if (!Hlp_IsValidNpc(actor)) { return 0; };
    return Npc_IsDead(actor);
};
func void LKN_UpdateCampLosses() {
    if (LKN_CampActorDead(Hlp_GetNpc(LKN_FireMaster))) { Patch_LivingKhorinis_FireCampLost = 1; };
    if (LKN_CampActorDead(Hlp_GetNpc(LKN_WaterMaster))) { Patch_LivingKhorinis_WaterCampLost = 1; };
    if (LKN_CampActorDead(Hlp_GetNpc(LKN_SectMaster))) { Patch_LivingKhorinis_SectCampLost = 1; };
    if (LKN_CampActorDead(Hlp_GetNpc(LKN_FortCaptain))) { LKN_CaptainLost = 1; };
    if (LKN_CampActorDead(Hlp_GetNpc(LKN_FortSteward))) { LKN_StewardLost = 1; };
    if ((LKN_CaptainLost == 1) && (LKN_StewardLost == 1) && (LKN_RaidStage != 3)) {
        LKN_RaidStage = 3;
        Patch_LivingKhorinis_WarUnlocked = 1;
        LKN_RaidLeave(Hlp_GetNpc(LKN_RaiderA));
        LKN_RaidLeave(Hlp_GetNpc(LKN_RaiderB));
        LKN_RaidLeave(Hlp_GetNpc(LKN_RaiderC));
    };
    if (LKN_CampActorDead(Hlp_GetNpc(LKN_CityFireMage))) { Patch_LivingKhorinis_CityFireLost=1; Patch_LivingKhorinis_MilitiaFire=0; };
    if (LKN_CampActorDead(Hlp_GetNpc(LKN_CityWaterMage))) { Patch_LivingKhorinis_CityWaterLost=1; Patch_LivingKhorinis_MilitiaWater=0; };
    if (LKN_CampActorDead(Hlp_GetNpc(LKN_OnarWaterMage))) { Patch_LivingKhorinis_OnarWaterLost=1; Patch_LivingKhorinis_MercenaryWater=0; };
    if (LKN_CampActorDead(Hlp_GetNpc(LKN_OnarSectMage))) { Patch_LivingKhorinis_OnarSectLost=1; Patch_LivingKhorinis_MercenarySect=0; };
};

func int LKN_CasterBeat(var C_NPC mage,var C_NPC enemy,var string origin,var int spell,var int mana,var int order,var int cast) {
    var string objective;
    if ((!Hlp_IsValidNpc(mage)) || Npc_IsDead(mage)) { return 0; };
    if (Patch_LivingKhorinis_AttackSide == 0) {
        if (order != 0) {
            Npc_ClearAIQueue(mage);
            AI_RemoveWeapon(mage);
            AI_GotoWP(mage,origin);
            return 3;
        };
        return 0;
    };
    objective = LKN_SupplyDestination(Patch_LivingKhorinis_AttackPost);
    if (order != Patch_LivingKhorinis_Dispatched) {
        Npc_ClearAIQueue(mage);
        AI_RemoveWeapon(mage);
        AI_GotoWP(mage,objective);
        return 1;
    };
    if ((!Hlp_IsValidNpc(enemy)) || Npc_IsDead(enemy)) { return 0; };
    if ((cast != Patch_LivingKhorinis_Dispatched) &&
        (Npc_GetDistToWP(mage,objective) < 1450) &&
        (Npc_GetDistToNpc(mage,enemy) < 1900) &&
        (Npc_GetDistToNpc(mage,hero) < 3000)) {
        Npc_ClearAIQueue(mage);
        AI_RemoveWeapon(mage);
        Npc_SetTarget(mage,enemy);
        AI_ReadySpell(mage,spell,mana);
        AI_Wait(mage,1);
        AI_Attack(mage);
        return 2;
    };
    return 0;
};

var int LKN_Order_CityFireMage;
var int LKN_Cast_CityFireMage;
func void LKN_Handle_CityFireMage() {
    var C_NPC mage;
    var int result;
    if ((Patch_LivingKhorinis_MilitiaFire == 0) || (Patch_LivingKhorinis_CityFireLost != 0)) { return; };
    mage = Hlp_GetNpc(LKN_CityFireMage);
    if (!Hlp_IsValidNpc(mage)) {
        Wld_InsertNpc(LKN_CityFireMage,LKN_FireHireWP);
        mage = Hlp_GetNpc(LKN_CityFireMage);
        LKN_Order_CityFireMage = 0;
    };
    result = LKN_CasterBeat(mage,Hlp_GetNpc(LKN_OnarScout),LKN_FireHireWP,SPL_Firebolt,SPL_Cost_Firebolt,LKN_Order_CityFireMage,LKN_Cast_CityFireMage);
    if (result == 1) { LKN_Order_CityFireMage = Patch_LivingKhorinis_Dispatched; };
    if (result == 2) { LKN_Cast_CityFireMage = Patch_LivingKhorinis_Dispatched; };
    if (result == 3) { LKN_Order_CityFireMage = 0; };
};

var int LKN_Order_CityWaterMage;
var int LKN_Cast_CityWaterMage;
func void LKN_Handle_CityWaterMage() {
    var C_NPC mage;
    var int result;
    if ((Patch_LivingKhorinis_MilitiaWater == 0) || (Patch_LivingKhorinis_CityWaterLost != 0)) { return; };
    mage = Hlp_GetNpc(LKN_CityWaterMage);
    if (!Hlp_IsValidNpc(mage)) {
        Wld_InsertNpc(LKN_CityWaterMage,"NW_TROLLAREA_PORTAL_KDWWAIT_02");
        mage = Hlp_GetNpc(LKN_CityWaterMage);
        LKN_Order_CityWaterMage = 0;
    };
    result = LKN_CasterBeat(mage,Hlp_GetNpc(LKN_OnarScout),"NW_TROLLAREA_PORTAL_KDWWAIT_02",SPL_Icelance,SPL_Cost_Icelance,LKN_Order_CityWaterMage,LKN_Cast_CityWaterMage);
    if (result == 1) { LKN_Order_CityWaterMage = Patch_LivingKhorinis_Dispatched; };
    if (result == 2) { LKN_Cast_CityWaterMage = Patch_LivingKhorinis_Dispatched; };
    if (result == 3) { LKN_Order_CityWaterMage = 0; };
};

var int LKN_Order_OnarWaterMage;
var int LKN_Cast_OnarWaterMage;
func void LKN_Handle_OnarWaterMage() {
    var C_NPC mage;
    var int result;
    if ((Patch_LivingKhorinis_MercenaryWater == 0) || (Patch_LivingKhorinis_OnarWaterLost != 0)) { return; };
    mage = Hlp_GetNpc(LKN_OnarWaterMage);
    if (!Hlp_IsValidNpc(mage)) {
        Wld_InsertNpc(LKN_OnarWaterMage,"NW_TROLLAREA_PORTAL_KDWWAIT_03");
        mage = Hlp_GetNpc(LKN_OnarWaterMage);
        LKN_Order_OnarWaterMage = 0;
    };
    result = LKN_CasterBeat(mage,Hlp_GetNpc(LKN_CityScout),"NW_TROLLAREA_PORTAL_KDWWAIT_03",SPL_Icelance,SPL_Cost_Icelance,LKN_Order_OnarWaterMage,LKN_Cast_OnarWaterMage);
    if (result == 1) { LKN_Order_OnarWaterMage = Patch_LivingKhorinis_Dispatched; };
    if (result == 2) { LKN_Cast_OnarWaterMage = Patch_LivingKhorinis_Dispatched; };
    if (result == 3) { LKN_Order_OnarWaterMage = 0; };
};

var int LKN_Order_OnarSectMage;
var int LKN_Cast_OnarSectMage;
func void LKN_Handle_OnarSectMage() {
    var C_NPC mage;
    var int result;
    if ((Patch_LivingKhorinis_MercenarySect == 0) || (Patch_LivingKhorinis_OnarSectLost != 0)) { return; };
    mage = Hlp_GetNpc(LKN_OnarSectMage);
    if (!Hlp_IsValidNpc(mage)) {
        Wld_InsertNpc(LKN_OnarSectMage,LKN_SectCampWP);
        mage = Hlp_GetNpc(LKN_OnarSectMage);
        LKN_Order_OnarSectMage = 0;
    };
    result = LKN_CasterBeat(mage,Hlp_GetNpc(LKN_CityScout),LKN_SectCampWP,SPL_Sleep,SPL_Cost_Sleep,LKN_Order_OnarSectMage,LKN_Cast_OnarSectMage);
    if (result == 1) { LKN_Order_OnarSectMage = Patch_LivingKhorinis_Dispatched; };
    if (result == 2) { LKN_Cast_OnarSectMage = Patch_LivingKhorinis_Dispatched; };
    if (result == 3) { LKN_Order_OnarSectMage = 0; };
};
func void LKN_MageOrders() {
    var C_NPC previousSelf;
    var C_NPC previousOther;
    previousSelf = self;
    previousOther = other;
    LKN_Handle_CityFireMage();
    LKN_Handle_CityWaterMage();
    LKN_Handle_OnarWaterMage();
    LKN_Handle_OnarSectMage();
    self = previousSelf;
    other = previousOther;
};

const string LKN_CampRationsText = "Camp rations: ";
const string LKN_CampAskText = "Ask about the camp and its contracts.";
const string LKN_CampBreadText = "Give the camp a loaf of bread.";
func void LKN_CampReport() {
    if (((self.id >= 61072) && (self.id <= 61074)) || (self.id == 61083)) {
        LKN_Subtitle("Our Brotherhood shelters here. We hire out to Onar, never the paladins.");
        Print(ConcatStrings(LKN_CampRationsText,IntToString(Patch_LivingKhorinis_SectFood)));
        if (Patch_LivingKhorinis_MercenarySect > 0) { Print("Onar has hired our caster."); };
    } else if ((self.id >= 61080) && (self.id <= 61082)) {
        LKN_Subtitle("The monastery keeps its own watch. Our battle mages only serve Khorinis paladins.");
        Print(ConcatStrings(LKN_CampRationsText,IntToString(Patch_LivingKhorinis_FireSupply)));
        if (Patch_LivingKhorinis_MilitiaFire > 0) { Print("Khorinis has hired a Fire mage."); };
    } else {
        LKN_Subtitle("The Water watch guards the ruins. We send mages to either side under contract, but our camp stays neutral.");
        Print(ConcatStrings(LKN_CampRationsText,IntToString(Patch_LivingKhorinis_WaterSupply)));
        if (Patch_LivingKhorinis_MilitiaWater > 0) { Print("Khorinis has hired a Water mage."); };
        if (Patch_LivingKhorinis_MercenaryWater > 0) { Print("Onar has hired a Water mage."); };
    };
};
func int LKN_CampCanDonate() {
    if (Npc_HasItems(other,ItFo_Bread) < 1) { return FALSE; };
    if (self.id == 61072) {
        return (LKN_SectDonation < Wld_GetDay()+1) && (Patch_LivingKhorinis_SectFood <= 23);
    };
    if (self.id == 61080) { return (LKN_FireDonation < Wld_GetDay()+1) && (Patch_LivingKhorinis_FireSupply <= 95); };
    return (LKN_WaterDonation < Wld_GetDay()+1) && (Patch_LivingKhorinis_WaterSupply <= 95);
};
func void LKN_CampDonate() {
    if (!LKN_CampCanDonate()) { return; };
    Npc_RemoveInvItems(other,ItFo_Bread,1);
    if (self.id == 61072) {
        Patch_LivingKhorinis_SectFood = Patch_LivingKhorinis_SectFood + 5;
        LKN_SectDonation = Wld_GetDay()+1;
    } else if (self.id == 61080) {
        Patch_LivingKhorinis_FireSupply = Patch_LivingKhorinis_FireSupply + 5;
        LKN_FireDonation = Wld_GetDay()+1;
    } else {
        Patch_LivingKhorinis_WaterSupply = Patch_LivingKhorinis_WaterSupply + 5;
        LKN_WaterDonation = Wld_GetDay()+1;
    };
    LKN_Subtitle("The camp accepts your bread.");
};

instance DIA_LKN_WaterMaster_Camp(C_INFO) {
    npc = LKN_WaterMaster;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_WaterMaster_Gift(C_INFO) {
    npc = LKN_WaterMaster;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CampCanDonate;
    information = LKN_CampDonate;
    description = LKN_CampBreadText;
};

instance DIA_LKN_WaterMaster_Leave(C_INFO) {
    npc = LKN_WaterMaster;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_WaterGuard1_Camp(C_INFO) {
    npc = LKN_WaterGuard1;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_WaterGuard1_Leave(C_INFO) {
    npc = LKN_WaterGuard1;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_WaterGuard2_Camp(C_INFO) {
    npc = LKN_WaterGuard2;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_WaterGuard2_Leave(C_INFO) {
    npc = LKN_WaterGuard2;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_WaterAcolyte1_Camp(C_INFO) {
    npc = LKN_WaterAcolyte1;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_WaterAcolyte1_Leave(C_INFO) {
    npc = LKN_WaterAcolyte1;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_WaterAcolyte2_Camp(C_INFO) {
    npc = LKN_WaterAcolyte2;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_WaterAcolyte2_Leave(C_INFO) {
    npc = LKN_WaterAcolyte2;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_SectMaster_Camp(C_INFO) {
    npc = LKN_SectMaster;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_SectMaster_Gift(C_INFO) {
    npc = LKN_SectMaster;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CampCanDonate;
    information = LKN_CampDonate;
    description = LKN_CampBreadText;
};

instance DIA_LKN_SectMaster_Leave(C_INFO) {
    npc = LKN_SectMaster;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_SectGuard_Camp(C_INFO) {
    npc = LKN_SectGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_SectGuard_Leave(C_INFO) {
    npc = LKN_SectGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_SectNovice_Camp(C_INFO) {
    npc = LKN_SectNovice;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_SectNovice_Leave(C_INFO) {
    npc = LKN_SectNovice;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_FireMaster_Camp(C_INFO) {
    npc = LKN_FireMaster;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_FireMaster_Gift(C_INFO) {
    npc = LKN_FireMaster;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CampCanDonate;
    information = LKN_CampDonate;
    description = LKN_CampBreadText;
};

instance DIA_LKN_FireMaster_Leave(C_INFO) {
    npc = LKN_FireMaster;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_FireGuard1_Camp(C_INFO) {
    npc = LKN_FireGuard1;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_FireGuard1_Leave(C_INFO) {
    npc = LKN_FireGuard1;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_FireGuard2_Camp(C_INFO) {
    npc = LKN_FireGuard2;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_FireGuard2_Leave(C_INFO) {
    npc = LKN_FireGuard2;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_SectGuard2_Camp(C_INFO) {
    npc = LKN_SectGuard2;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_CampReport;
    description = LKN_CampAskText;
};

instance DIA_LKN_SectGuard2_Leave(C_INFO) {
    npc = LKN_SectGuard2;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

var int LKN_RoadNetworkPlaced;
var int LKN_Appearance_ForestCamp;
var int LKN_Appearance_BridgeCamp;
var int LKN_Appearance_RiverCamp;

instance LKN_Build_ForestCamp(C_Item) {
    name = "Forest crossing camp";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_SECT.3DS";
    value = 0;
};

instance LKN_Build_BridgeCamp(C_Item) {
    name = "Bridge road camp";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_SECT.3DS";
    value = 0;
};

instance LKN_Build_RiverCamp(C_Item) {
    name = "Riverbank camp";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_SECT.3DS";
    value = 0;
};

instance LKN_Build_LighthouseRoad(C_Item) {
    name = "Lighthouse road watch";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_DOCK.3DS";
    value = 0;
};

instance LKN_Build_FarmRoad(C_Item) {
    name = "Lobart road watch";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_CROSS.3DS";
    value = 0;
};

instance LKN_Build_XardasRoad(C_Item) {
    name = "Xardas road watch";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_CROSS.3DS";
    value = 0;
};

instance LKN_Build_TavernRoad(C_Item) {
    name = "Tavern road watch";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_CROSS.3DS";
    value = 0;
};

instance LKN_Build_ValleyRoad(C_Item) {
    name = "Valley approach watch";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_CROSS.3DS";
    value = 0;
};

instance LKN_Build_ValleyGate(C_Item) {
    name = "Valley of Mines garrison";
    mainflag = ITEM_KAT_NONE;
    flags = ITEM_MISSION;
    material = MAT_WOOD;
    visual = "LKN_RIDGE.3DS";
    value = 0;
};

func void LKN_TA_ForestCampGuard() {
    TA_Stand_Guarding(6,0,18,0,LKN_WP_ForestCamp);
    TA_Stand_Guarding(18,0,6,0,LKN_WP_ForestCamp);
};
instance LKN_ForestCampGuard(Npc_Default) {
    id = 61086;
    name[0] = "Forest camp sentry";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_BAU_M);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_ForestCampGuard;
};

func void LKN_TA_BridgeCampGuard() {
    TA_Stand_Guarding(6,0,18,0,LKN_WP_BridgeCamp);
    TA_Stand_Guarding(18,0,6,0,LKN_WP_BridgeCamp);
};
instance LKN_BridgeCampGuard(Npc_Default) {
    id = 61087;
    name[0] = "Bridge camp sentry";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_BAU_M);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_BridgeCampGuard;
};

func void LKN_TA_RiverCampGuard() {
    TA_Stand_Guarding(6,0,18,0,LKN_WP_RiverCamp);
    TA_Stand_Guarding(18,0,6,0,LKN_WP_RiverCamp);
};
instance LKN_RiverCampGuard(Npc_Default) {
    id = 61088;
    name[0] = "River camp sentry";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_BAU_M);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_RiverCampGuard;
};

func void LKN_TA_LighthouseGuard() {
    TA_Stand_Guarding(6,0,18,0,LKN_WP_LighthouseRoad);
    TA_Stand_Guarding(18,0,6,0,LKN_WP_LighthouseRoad);
};
instance LKN_LighthouseGuard(Npc_Default) {
    id = 61089;
    name[0] = "Khorinis guard on Lighthouse Road";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_LighthouseGuard;
};

func void LKN_TA_FarmRoadGuard() {
    TA_Stand_Guarding(6,0,18,0,LKN_WP_FarmRoad);
    TA_Stand_Guarding(18,0,6,0,LKN_WP_FarmRoad);
};
instance LKN_FarmRoadGuard(Npc_Default) {
    id = 61090;
    name[0] = "Khorinis guard at the farm junction";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_FarmRoadGuard;
};

func void LKN_TA_XardasRoadGuard() {
    TA_Stand_Guarding(6,0,18,0,LKN_WP_XardasRoad);
    TA_Stand_Guarding(18,0,6,0,LKN_WP_XardasRoad);
};
instance LKN_XardasRoadGuard(Npc_Default) {
    id = 61091;
    name[0] = "Khorinis guard on Xardas Road";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_XardasRoadGuard;
};

func void LKN_TA_TavernRoadGuard() {
    TA_Stand_Guarding(6,0,18,0,LKN_WP_TavernRoad);
    TA_Stand_Guarding(18,0,6,0,LKN_WP_TavernRoad);
};
instance LKN_TavernRoadGuard(Npc_Default) {
    id = 61092;
    name[0] = "Khorinis guard on the tavern road";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_TavernRoadGuard;
};

func void LKN_TA_ValleyRoadGuard() {
    TA_Stand_Guarding(6,0,18,0,LKN_WP_ValleyRoad);
    TA_Stand_Guarding(18,0,6,0,LKN_WP_ValleyRoad);
};
instance LKN_ValleyRoadGuard(Npc_Default) {
    id = 61093;
    name[0] = "Khorinis guard below the pass";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_ValleyRoadGuard;
};

func void LKN_TA_PassCaptain() {
    TA_Min(self,6,0,18,0,ZS_LKN_Quartermaster,"NW_PASS_GATEGUARD_01");
    TA_Min(self,18,0,6,0,ZS_LKN_Quartermaster,"NW_PASS_GATEGUARD_01");
};
instance LKN_PassCaptain(Npc_Default) {
    id = 61094;
    name[0] = "Gerwin, captain of the pass";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_PAL_M);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_PassCaptain;
};

func void LKN_TA_PassKnight1() {
    TA_Stand_Guarding(6,0,18,0,"NW_PASS_GATEGUARD_02");
    TA_Stand_Guarding(18,0,6,0,"NW_PASS_GATEGUARD_02");
};
instance LKN_PassKnight1(Npc_Default) {
    id = 61095;
    name[0] = "Balin, knight of the pass";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_PAL_M);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_PassKnight1;
};

func void LKN_TA_PassKnight2() {
    TA_Stand_Guarding(6,0,18,0,"NW_PASS_01");
    TA_Stand_Guarding(18,0,6,0,"NW_PASS_01");
};
instance LKN_PassKnight2(Npc_Default) {
    id = 61096;
    name[0] = "Hardin, knight of the pass";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_PAL_M);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_PassKnight2;
};

func void LKN_TA_PassShield1() {
    TA_Stand_Guarding(6,0,18,0,"NW_PASS_06");
    TA_Stand_Guarding(18,0,6,0,"NW_PASS_06");
};
instance LKN_PassShield1(Npc_Default) {
    id = 61097;
    name[0] = "Otwin, pass militia";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_PassShield1;
};

func void LKN_TA_PassShield2() {
    TA_Stand_Guarding(6,0,18,0,"NW_PASS_11");
    TA_Stand_Guarding(18,0,6,0,"NW_PASS_11");
};
instance LKN_PassShield2(Npc_Default) {
    id = 61098;
    name[0] = "Gernot, pass militia";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_PassShield2;
};

func void LKN_TA_PassShield3() {
    TA_Stand_Guarding(6,0,18,0,"NW_PASS_GATE_02");
    TA_Stand_Guarding(18,0,6,0,"NW_PASS_GATE_02");
};
instance LKN_PassShield3(Npc_Default) {
    id = 61099;
    name[0] = "Arnulf, pass militia";
    guild = GIL_NONE;
    npctype = NPCTYPE_MAIN;
    flags = 0;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    B_SetFightSkills(self,34);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_PassShield3;
};

func void LKN_CampUniform(var C_NPC guard,var int side) {
    if ((!Hlp_IsValidNpc(guard)) || Npc_IsDead(guard)) { return; };
    if (side == 1) {
        B_SetNpcVisual(guard,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_MIL_L);
    } else if (side == 2) {
        B_SetNpcVisual(guard,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_SLD_L);
    } else if (side == 4) {
        B_SetNpcVisual(guard,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_KDF_L);
    } else if (side == 5) {
        B_SetNpcVisual(guard,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_KDW_L_Addon);
    } else if (side == 6) {
        B_SetNpcVisual(guard,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ITAR_NOV_L);
    };
};
func void LKN_RoadNetworkVisuals() {
    var C_NPC guard;
    if (LKN_Appearance_ForestCamp != Patch_LivingKhorinis_ForestCampOwner) {
        guard = Hlp_GetNpc(LKN_ForestCampGuard);
        if (Hlp_IsValidNpc(guard)) {
            LKN_CampUniform(guard,Patch_LivingKhorinis_ForestCampOwner);
            LKN_Appearance_ForestCamp = Patch_LivingKhorinis_ForestCampOwner;
        };
    };
    if (LKN_Appearance_BridgeCamp != Patch_LivingKhorinis_BridgeCampOwner) {
        guard = Hlp_GetNpc(LKN_BridgeCampGuard);
        if (Hlp_IsValidNpc(guard)) {
            LKN_CampUniform(guard,Patch_LivingKhorinis_BridgeCampOwner);
            LKN_Appearance_BridgeCamp = Patch_LivingKhorinis_BridgeCampOwner;
        };
    };
    if (LKN_Appearance_RiverCamp != Patch_LivingKhorinis_RiverCampOwner) {
        guard = Hlp_GetNpc(LKN_RiverCampGuard);
        if (Hlp_IsValidNpc(guard)) {
            LKN_CampUniform(guard,Patch_LivingKhorinis_RiverCampOwner);
            LKN_Appearance_RiverCamp = Patch_LivingKhorinis_RiverCampOwner;
        };
    };
};
func void LKN_RoadNetworkInit() {
    var C_NPC oldSelf;
    var C_NPC oldOther;
    oldSelf = self;
    oldOther = other;
    if (LKN_RoadNetworkPlaced == 0) {
        Wld_InsertItem(LKN_Build_ForestCamp,LKN_WP_ForestCamp);
        Wld_InsertItem(LKN_Build_BridgeCamp,LKN_WP_BridgeCamp);
        Wld_InsertItem(LKN_Build_RiverCamp,LKN_WP_RiverCamp);
        Wld_InsertItem(LKN_Build_LighthouseRoad,LKN_WP_LighthouseRoad);
        Wld_InsertItem(LKN_Build_FarmRoad,LKN_WP_FarmRoad);
        Wld_InsertItem(LKN_Build_XardasRoad,LKN_WP_XardasRoad);
        Wld_InsertItem(LKN_Build_TavernRoad,LKN_WP_TavernRoad);
        Wld_InsertItem(LKN_Build_ValleyRoad,LKN_WP_ValleyRoad);
        Wld_InsertItem(LKN_Build_ValleyGate,LKN_WP_ValleyGate);
        LKN_RoadNetworkPlaced = 1;
    };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_ForestCampGuard))) { Wld_InsertNpc(LKN_ForestCampGuard,LKN_WP_ForestCamp); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_BridgeCampGuard))) { Wld_InsertNpc(LKN_BridgeCampGuard,LKN_WP_BridgeCamp); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_RiverCampGuard))) { Wld_InsertNpc(LKN_RiverCampGuard,LKN_WP_RiverCamp); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_LighthouseGuard))) { Wld_InsertNpc(LKN_LighthouseGuard,LKN_WP_LighthouseRoad); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_FarmRoadGuard))) { Wld_InsertNpc(LKN_FarmRoadGuard,LKN_WP_FarmRoad); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_XardasRoadGuard))) { Wld_InsertNpc(LKN_XardasRoadGuard,LKN_WP_XardasRoad); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_TavernRoadGuard))) { Wld_InsertNpc(LKN_TavernRoadGuard,LKN_WP_TavernRoad); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_ValleyRoadGuard))) { Wld_InsertNpc(LKN_ValleyRoadGuard,LKN_WP_ValleyRoad); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_PassCaptain))) { Wld_InsertNpc(LKN_PassCaptain,"NW_PASS_GATEGUARD_01"); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_PassKnight1))) { Wld_InsertNpc(LKN_PassKnight1,"NW_PASS_GATEGUARD_02"); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_PassKnight2))) { Wld_InsertNpc(LKN_PassKnight2,"NW_PASS_01"); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_PassShield1))) { Wld_InsertNpc(LKN_PassShield1,"NW_PASS_06"); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_PassShield2))) { Wld_InsertNpc(LKN_PassShield2,"NW_PASS_11"); };
    if (!Hlp_IsValidNpc(Hlp_GetNpc(LKN_PassShield3))) { Wld_InsertNpc(LKN_PassShield3,"NW_PASS_GATE_02"); };
    self = oldSelf;
    other = oldOther;
};

instance DIA_LKN_ForestCampGuard_Status(C_INFO) {
    npc = LKN_ForestCampGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_ForestCampGuard_Bread(C_INFO) {
    npc = LKN_ForestCampGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_ForestCampGuard_Leave(C_INFO) {
    npc = LKN_ForestCampGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_BridgeCampGuard_Status(C_INFO) {
    npc = LKN_BridgeCampGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_BridgeCampGuard_Bread(C_INFO) {
    npc = LKN_BridgeCampGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_BridgeCampGuard_Leave(C_INFO) {
    npc = LKN_BridgeCampGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_RiverCampGuard_Status(C_INFO) {
    npc = LKN_RiverCampGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_RiverCampGuard_Bread(C_INFO) {
    npc = LKN_RiverCampGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_RiverCampGuard_Leave(C_INFO) {
    npc = LKN_RiverCampGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_LighthouseGuard_Status(C_INFO) {
    npc = LKN_LighthouseGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_LighthouseGuard_Bread(C_INFO) {
    npc = LKN_LighthouseGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_LighthouseGuard_Leave(C_INFO) {
    npc = LKN_LighthouseGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_FarmRoadGuard_Status(C_INFO) {
    npc = LKN_FarmRoadGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_FarmRoadGuard_Bread(C_INFO) {
    npc = LKN_FarmRoadGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_FarmRoadGuard_Leave(C_INFO) {
    npc = LKN_FarmRoadGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_XardasRoadGuard_Status(C_INFO) {
    npc = LKN_XardasRoadGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_XardasRoadGuard_Bread(C_INFO) {
    npc = LKN_XardasRoadGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_XardasRoadGuard_Leave(C_INFO) {
    npc = LKN_XardasRoadGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_TavernRoadGuard_Status(C_INFO) {
    npc = LKN_TavernRoadGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_TavernRoadGuard_Bread(C_INFO) {
    npc = LKN_TavernRoadGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_TavernRoadGuard_Leave(C_INFO) {
    npc = LKN_TavernRoadGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_ValleyRoadGuard_Status(C_INFO) {
    npc = LKN_ValleyRoadGuard;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_ValleyRoadGuard_Bread(C_INFO) {
    npc = LKN_ValleyRoadGuard;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_ValleyRoadGuard_Leave(C_INFO) {
    npc = LKN_ValleyRoadGuard;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_PassCaptain_Status(C_INFO) {
    npc = LKN_PassCaptain;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_PassCaptain_Bread(C_INFO) {
    npc = LKN_PassCaptain;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_PassCaptain_Leave(C_INFO) {
    npc = LKN_PassCaptain;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_PassKnight1_Status(C_INFO) {
    npc = LKN_PassKnight1;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_PassKnight1_Bread(C_INFO) {
    npc = LKN_PassKnight1;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_PassKnight1_Leave(C_INFO) {
    npc = LKN_PassKnight1;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_PassKnight2_Status(C_INFO) {
    npc = LKN_PassKnight2;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_PassKnight2_Bread(C_INFO) {
    npc = LKN_PassKnight2;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_PassKnight2_Leave(C_INFO) {
    npc = LKN_PassKnight2;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_PassShield1_Status(C_INFO) {
    npc = LKN_PassShield1;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_PassShield1_Bread(C_INFO) {
    npc = LKN_PassShield1;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_PassShield1_Leave(C_INFO) {
    npc = LKN_PassShield1;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_PassShield2_Status(C_INFO) {
    npc = LKN_PassShield2;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_PassShield2_Bread(C_INFO) {
    npc = LKN_PassShield2;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_PassShield2_Leave(C_INFO) {
    npc = LKN_PassShield2;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};

instance DIA_LKN_PassShield3_Status(C_INFO) {
    npc = LKN_PassShield3;
    nr = 10;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_PostSpeak;
    description = LKN_AskPostText;
};

instance DIA_LKN_PassShield3_Bread(C_INFO) {
    npc = LKN_PassShield3;
    nr = 11;
    permanent = TRUE;
    condition = LKN_CanFeedPost;
    information = LKN_FeedPost;
    description = LKN_FeedPostText;
};

instance DIA_LKN_PassShield3_Leave(C_INFO) {
    npc = LKN_PassShield3;
    nr = 999;
    permanent = TRUE;
    condition = LKN_Always;
    information = LKN_Leave;
    description = LKN_EndPostTalk;
};
