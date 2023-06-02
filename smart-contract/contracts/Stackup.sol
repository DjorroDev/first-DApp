// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract StackUp {
    enum PlayerQuestStatus {
        NOT_JOINED,
        JOINED,
        SUBMITTED,
        REJECTED,
        APPROVED,
        REWARDED
    }
    struct Quest {
        uint256 questId;
        uint256 numberOfPlayers;
        string title;
        uint8 reward;
        uint256 numberOfRewards;
    }

    address public admin;
    uint256 public nextQuestId;
    mapping(uint256 => Quest) public quests;
    mapping(address => mapping(uint256 => PlayerQuestStatus))
        public playerQuestStatuses;
    mapping(address => mapping(uint256 => string)) public playerSubmissions; //Player submission a string type

    // An event listening and storing log of player submission
    event QuestSubmission(
        uint256 indexed questId,
        address indexed player,
        string submission
    );

    constructor() {
        admin = msg.sender;
    }

    function createQuest(
        string calldata title_,
        uint8 reward_,
        uint256 numberOfRewards_
    ) external onlyAdmin {
        quests[nextQuestId].questId = nextQuestId;
        quests[nextQuestId].title = title_;
        quests[nextQuestId].reward = reward_;
        quests[nextQuestId].numberOfRewards = numberOfRewards_;

        nextQuestId++;
    }

    function joinQuest(uint256 questId) external questExists(questId) {
        require(
            playerQuestStatuses[msg.sender][questId] ==
                PlayerQuestStatus.NOT_JOINED,
            "Player has already joined/submitted this quest"
        );
        playerQuestStatuses[msg.sender][questId] = PlayerQuestStatus.JOINED;

        Quest storage thisQuest = quests[questId];
        thisQuest.numberOfPlayers++;
    }

    function submitQuest(
        uint256 questId,
        string calldata submission
    ) external questExists(questId) {
        require(
            playerQuestStatuses[msg.sender][questId] ==
                PlayerQuestStatus.JOINED,
            "Player must first join the quest"
        );

        playerQuestStatuses[msg.sender][questId] = PlayerQuestStatus.SUBMITTED;
        playerSubmissions[msg.sender][questId] = submission;

        // Emitting data Quest submission value to the event
        emit QuestSubmission(questId, msg.sender, submission);
    }

    function reviewQuest(
        uint256 questId,
        uint256 status,
        address playerAddr
    ) external onlyAdmin questExists(questId) {
        require(
            playerQuestStatuses[playerAddr][questId] ==
                PlayerQuestStatus.SUBMITTED,
            "The player need to submitt the quest"
        );
        require(status >= 3 && status <= 5, "Invalid status"); // Validate the status value
        // The uint status value based on the enum order of PlayerQuestStatus
        // Start from 3 to 5 Which is REJECTED, APPROVED, REWARDED

        playerQuestStatuses[playerAddr][questId] = PlayerQuestStatus(status);
    }

    function updateQuest(
        uint256 questId,
        string calldata newTitle,
        uint8 newReward,
        uint256 newNumberOfRewards
    ) external onlyAdmin questExists(questId) {
        // Perform necessary validations and checks, then update the quest
        quests[questId].title = newTitle;
        quests[questId].reward = newReward;
        quests[questId].numberOfRewards = newNumberOfRewards;
    }

    function deleteQuest(
        uint256 questId
    ) external onlyAdmin questExists(questId) {
        // Perform necessary validations and checks, then delete the quest
        delete quests[questId];
    }

    modifier questExists(uint256 questId) {
        require(quests[questId].reward != 0, "Quest does not exist");
        _;
    }

    // Adding modifier for admin only to make code not redundant
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only the admin can perform this action");
        _;
    }
}
