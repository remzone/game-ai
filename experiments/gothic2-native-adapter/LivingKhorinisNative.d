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
    LKN_Refresh();
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
        if (Patch_LivingKhorinis_MilitiaSupply >= 10) {
            Print("The militia supply store is full.");
            return;
        };
    } else {
        if (Patch_LivingKhorinis_MercenarySupply >= 10) {
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
