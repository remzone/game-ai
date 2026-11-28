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
    TA_Stand_WP(4,40,19,20,LKN_DockWP);
    TA_Min(self,19,20,4,40,ZS_LKN_Sawyer,LKN_DockWorkWP);
};
instance LKN_DockWorker(Npc_Default) {
    id = 61048;
    name[0] = "Jan, harbour sawyer";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Bald",Face_N_Normal01,BodyTex_N,ItAr_Bau_M);
    daily_routine = LKN_TA_DockWorker;
};
func void LKN_TA_MineWorker() {
    TA_Min(self,8,0,18,0,ZS_LKN_Miner,LKN_MineWorkWP);
    TA_Stand_WP(18,0,8,0,LKN_MineWP);
};
instance LKN_MineWorker(Npc_Default) {
    id = 61049;
    name[0] = "Mikkel, ore miner";
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
func string LKN_SupplyDestination(var int route) {
    if (route == 1) { return LKN_RoadPost; };
    if (route == 2) { return LKN_RidgeWP; };
    if (route == 3) { return LKN_DockWP; };
    if (route == 5) { return LKN_FortWP; };
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
    flags = NPC_FLAG_IMMORTAL;
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
    flags = NPC_FLAG_IMMORTAL;
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
    flags = NPC_FLAG_IMMORTAL;
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
    flags = NPC_FLAG_IMMORTAL;
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
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
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
    flags = NPC_FLAG_IMMORTAL;
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
    flags = NPC_FLAG_IMMORTAL;
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
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
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
    flags = NPC_FLAG_IMMORTAL;
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
    flags = NPC_FLAG_IMMORTAL;
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
    visual = "LKN_RIDGE.3DS";
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
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
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
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Pal_M);
    B_SetFightSkills(self,35);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_FortGuard;
};

instance LKN_FortGuardB(Npc_Default) {
    id = 61062;
    name[0] = "Odo, Gate Fort guard";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Mil_L);
    B_SetFightSkills(self,35);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_FortGuard;
};

instance LKN_RaiderA(Npc_Default) {
    id = 61063;
    name[0] = "Einar, Onar raider";
    guild = GIL_NONE;
    npctype = NPCTYPE_AMBIENT;
    flags = NPC_FLAG_IMMORTAL;
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
    flags = NPC_FLAG_IMMORTAL;
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
    flags = NPC_FLAG_IMMORTAL;
    B_SetAttributesToChapter(self,2);
    B_SetNpcVisual(self,MALE,"Hum_Head_Fighter",Face_N_Normal01,BodyTex_N,ItAr_Sld_L);
    B_SetFightSkills(self,35);
    fight_tactic = FAI_HUMAN_NORMAL;
    EquipItem(self,ItMw_1H_Mil_Sword);
    daily_routine = LKN_TA_Raider;
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
    self = oldSelf;
    other = oldOther;
};
func void LKN_RaidPair(var C_NPC raider,var C_NPC guard) {
    var C_NPC oldOther;
    if ((!Hlp_IsValidNpc(raider)) || (!Hlp_IsValidNpc(guard))) { return; };
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
    if (!Hlp_IsValidNpc(actor)) { return; };
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
        B_Attack(Hlp_GetNpc(LKN_RaiderC),other,AR_NONE,0);
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
    LKN_FortInit();
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
