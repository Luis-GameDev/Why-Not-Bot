// THIS FILE CONSISTS OF GLOBAL VARIABLES THAT ARE MEANT TO BE EDITED BY OFFICERS
// PLEASE DO NOT REMOVE ANY VARIABLES FROM THIS FILE OR THE BOT MIGHT BREAK

// FORMATTING INFO: Using \n for new lines, \t for tabs, and \` for code blocks

// SYSTEM MESSAGES

const WelcomeMessage = `\n
If you joined the guild please follow the instructions pinned here https://discord.com/channels/1248205717379354664/1330900761302929418 to link your account and get full permissions. \n
Once linked, please read https://discord.com/channels/1248205717379354664/1248250430283190273 and https://discord.com/channels/1248205717379354664/1267166145618640957`

// TICKETS

    // TICKET PANELS

    const ApplicationTicketPanelDescription = "Click on the button below to apply for membership in WHY NOT!"

    const ApplicationTicketPanelField1 = "- 60m pve fame\n- 20m pvp fame (exceptions can be made if vods are provided)\n- IGN + Screenshot of your Characters Stats (EU)\n- Ability to play 2 pvp roles and to record your game.\n- Speaking English, being able to join Voice channels and follow calls\n- Willingness to learn, improve, behave correctly with other people and be part of our community. We do not like guild hoppers / leechers."

    const ApplicationTicketPanelField2 = "(If you are thinking of the applying in the guild just so you can fame up on World Boss and then logout till the next World Boss session save yourself the trouble of applying. We do not need World Boss slaves but people that are interested on doing content and dive into our community)"

    const LeechTicketPanel = "Click on the button below to apply for a leech spot in WHY NOT!"

    const RentingTicketPanel = "Click on the button below to open a renting ticket in WHY NOT!"

    const DiplomacyTicketPanel = "Click on the button below to open a diplomacy ticket in WHY NOT!"

    const RegearTicketPanelDescription = "Click the button below to open a regear ticket in case you died during a regearable content session! Make sure to send a screenshot of the death and specify the below information..."

    const RegearTicketPanelField1 = "- Content \n - Caller \n - Time of Death (UTC) \n - Content Link"

    const RegearTicketPanelField2 = "1. Only approved builds on mandatory content will be regeared.\n2. If the regear ticket is opened after 24hrs has passed from the actual death, the regear will be denied.\n3. All regears must be withdrawn from chest within 24hrs from when the Regear Officer posted your regear chest."

    const WorldbossTicketPanelDescription = "In order to access World Boss content or solve WB related issues, please open a ticket sending the below information."

    const WorldbossTicketPanelField1 = "- Being able to provide information, rat, and defend the parties in your free time. \n- Screenshot on 100 spec on weapon and offhand or 100 spec armor if offtank. \n- Good english understanding and speaking in order to provide information from scout and be understood by the party. \n- Vouch of WB Member (not mandatory) \n- Willing to rat in case its needed. The rat presence is tracked by the guild. \n- Deposit of a Cautional Fee of 10 million silver. \n- Willingness to do at least 50m PVE fame each 14 days (equivalent fame amount of 2 hrs of WB). \n\nCautional Fee is NOT a payment: Its a caution we ask to ensure good behavior and rules abiding.\nYou will recieve the 10 million cautional fee if all the following conditions are met:\n1) You did not get kicked from the guild and you didnt systematically break rules\n2) Asked a WB Officer to have the fee back before leaving. We are humans, we cant and wont chase you. Officers are humans playing a game in their free time and for fun. Please respect that."

    const IssuesTicketPanelDescription = "Click the button below to open a ticket. Make sure to follow the below format and be patient for your reply from the officer that will handle your ticket!"

    const IssuesTicketPanelField1 = "- Type: \"Issue/Suggestion/Point system\"\n- Description: \"A description of your thoughts on the matter\""

    // TICKET MESSAGES

    const ApplicationTicketMessageDescription = "A recruiter will be with you shortly. Send the following information while waiting for support!"

    const ApplicationTicketMessage = `- Age\n- Country\n- Active timer\n- Ingame Name\n- Stats screenshot (EU). Provide Asia / West if you played there too.
- English level (written and spoken)\n- Do you have a vouch? Who?\n- Whats your favorite content?\n- Why are you applying to Why not?
- How do you think you can contribute to the guild?\n- Are you willing to attend mandatory content if necessary?\n- Are you aware that World Boss isn’t granted on access?
- What PVP roles can you play? No roles = deny.\n- Are you able to record the game while playing and post VODs on a regular basis?`

    const ApplicationTicketMessage2 = "Additionally complete an IQ-Test using the /iq command to prove your mental capability which is required to perform well in our guild."

    const LeechTicketMessageDescription = "Welcome! Info about leeching will be provided soon by a Leech Officer! In the mean time, send your in game stats screenshot and your character selection screenshot!"

    const LeechTicketMessage1 = "The average leech cost is 20mil/session, a session takes 2 hours and gives up to 80mil fame."

    const LeechTicketMessage2 = "You can rent any 4.4 Mobfame weapons for 2mil/session."

    const RentingTicketMessage = "Welcome! A Renting officer will be shortly here! In the mean time, please provide your /stats screenshot and your character selection screenshot. Thanks!"

    const DiplomacyTicketMessage = "Welcome! Please describe your issue as good as possible while you wait, our officers will be shortly with you."

    const RegearTicketMessageDescription = "Thank you for creating a regear ticket.\nPlease send your death screenshot along with the required information below..."

    const RegearTicketMessage = "- Content \n - Caller \n - Time of Death (UTC) \n - Content Link"

    const WorldbossTicketMessageDescription = "Thank you for opening a ticket to request access for World Boss. Please send us the required information:"

    const WorldbossTicketMessage = `1. Being able to provide information, rat, and defend the parties in your free time.
2. Screenshot on 100 spec on weapon and offhand from WB builds.
3. Good English understanding and speaking to provide information from scout and be understood by the party.
4. Vouch of WB Member (not mandatory).
5. Willingness to rat in case it is needed. The rat presence is tracked by the guild.
6. Deposit of a Caution Fee of 10 million silver.
7. Willingness to do at least 50m PVE fame every 14 days.`

    const IssuesTicketMessageDescription = "Thank you for opening a ticket, please follow the format written below!"

    const IssuesTicketMessage = "- Type: \"Issue/Suggestion/Point system\"\n- Description: \"A description of your thoughts on the matter\""

// REWARDS

const greenCore = {payment: 200000, reaction: "🟢", name: "Green Core in Lowland"};
const blueCore = {payment: 300000, reaction: "🔵", name: "Blue Core in Lowland"};
const purpleCore = {payment: 600000, reaction: "🟣", name: "Purple Core in Lowland"};
const goldCore = {payment: 1000000, reaction: "🟡", name: "Gold Core in Lowland"};

const greenVortex = {payment: 150000, reaction: "🟩", name: "Green Vortex"};
const blueVortex = {payment: 250000, reaction: "🟦", name: "Blue Vortex"};
const purpleVortex = {payment: 500000, reaction: "🟪", name: "Purple Vortex"};
const goldVortex = {payment: 750000, reaction: "🟨", name: "Gold Vortex"};

const greenCoreRavine = {payment: 100000, reaction: "💚", name: "Green Core in Ravine"};
const blueCoreRavine = {payment: 150000, reaction: "💙", name: "Blue Core in Ravine"};
const purpleCoreRavine = {payment: 300000, reaction: "💜", name: "Purple Core in Ravine"};
const goldCoreRavine = {payment: 500000, reaction: "💛", name: "Gold Core in Ravine"};

const random = {amount: 1, reaction: "⏺️", reason: "reward by officer"};


// DO NOT EDIT BELOW THIS LINE OR THE BOT MIGHT BREAK

module.exports = {
    WelcomeMessage,
    ApplicationTicketPanelDescription,
    ApplicationTicketPanelField1,
    ApplicationTicketPanelField2,
    LeechTicketPanel,
    RentingTicketPanel,
    DiplomacyTicketPanel,
    RegearTicketPanelDescription,
    RegearTicketPanelField1,
    RegearTicketPanelField2,
    WorldbossTicketPanelDescription,
    WorldbossTicketPanelField1,
    IssuesTicketPanelDescription,
    IssuesTicketPanelField1,
    ApplicationTicketMessage,
    RentingTicketMessage,
    DiplomacyTicketMessage,
    RegearTicketMessage,
    WorldbossTicketMessage,
    IssuesTicketMessage,
    ApplicationTicketMessageDescription,
    ApplicationTicketMessage2,
    LeechTicketMessageDescription,
    LeechTicketMessage1,
    LeechTicketMessage2,
    RentingTicketMessage,
    DiplomacyTicketMessage, 
    RegearTicketMessageDescription,
    RegearTicketMessage,
    WorldbossTicketMessageDescription,
    WorldbossTicketMessage,
    IssuesTicketMessageDescription,
    IssuesTicketMessage,

    greenCore, blueCore, purpleCore, goldCore, 
    greenVortex, blueVortex, purpleVortex, goldVortex, 
    greenCoreRavine, blueCoreRavine, purpleCoreRavine, goldCoreRavine,

    random
};
