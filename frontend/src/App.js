import React, { useEffect, useState } from "react";
import contract from "./contracts/StackUp.json";
import { ethers } from "ethers";

const contractAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const abi = contract.abi;

function App() {
  const [adminAddr, setAdminAddr] = useState("nil");
  const [currentAccount, setCurrentAccount] = useState(null);
  const [allQuestsInfo, setAllQuestsInfo] = useState(null);
  const [userQuestStatuses, setUserQuestStatuses] = useState(null);
  const [questId, setQuestId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [questTitle, setQuestTitle] = useState("");
  const [questReward, setQuestReward] = useState(0);
  const [numberOfRewards, setNumberOfRewards] = useState(0);

  const [submissions, setSubmissions] = useState([]);
  const [submission, setSubmission] = useState("");

  const [status, setStatus] = useState(0);
  const [playerAddr, setPlayerAddr] = useState("");

  const onOptionChange = (e) => {
    setStatus(e.target.value);
  };

  const connectWalletHandler = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log(accounts);
        setCurrentAccount(accounts[0]);
        console.log("found an account:", accounts[0]);
      } catch (err) {
        console.log(err);
      }
    } else {
      // MetaMask not installed
      console.log("please install metamask");
    }
  };

  const getAdminAddr = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const stackupContract = new ethers.Contract(contractAddr, abi, provider);

      const adminAddr = await stackupContract.admin();
      // console.log("adminAddr:", adminAddr);
      setAdminAddr(adminAddr);
      setIsAdmin(adminAddr.toLowerCase() === currentAccount);
      // console.log(isAdmin)
    } catch (err) {
      console.log("getAdminAddr error...");
      console.log(err);
    }
  };

  const getQuestsInfo = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const stackupContract = new ethers.Contract(contractAddr, abi, provider);

      const nextQuestId = await stackupContract.nextQuestId();
      let allQuestsInfo = [];
      let thisQuest;
      for (let i = 0; i < nextQuestId; i++) {
        thisQuest = await stackupContract.quests(i);
        allQuestsInfo.push(thisQuest);
      }
      setAllQuestsInfo(allQuestsInfo);
    } catch (err) {
      console.log("getQuestsInfo error...");
      console.log(err);
    }
  };

  const getQuestSubmissions = async (questId) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const stackupContract = new ethers.Contract(contractAddr, abi, provider);

      const filter = stackupContract.filters.QuestSubmission(questId);
      const logs = await stackupContract.queryFilter(filter);

      const newSubmissions = logs.map((log) => ({
        player: log.args.player,
        submission: log.args.submission,
      }));

      setSubmissions(newSubmissions);
    } catch (err) {
      console.log("getQuestSubmissions error...");
      console.log(err);
    }
  };

  const getUserQuestStatuses = async () => {
    try {
      if (currentAccount) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const stackupContract = new ethers.Contract(contractAddr, abi, provider);

        const nextQuestId = await stackupContract.nextQuestId();
        const questStatusMapping = {
          0: "Not Joined",
          1: "Joined",
          2: "Submitted",
          3: "Rejected",
          4: "Approved",
          5: "Rewarded",
        };
        let userQuestStatuses = [];
        let thisQuest;

        for (let i = 0; i < nextQuestId; i++) {
          let thisQuestStatus = [];
          thisQuest = await stackupContract.quests(i);

          let thisQuestTitle = thisQuest[2];
          let thisQuestId = thisQuest[0];

          thisQuestStatus.push(thisQuestTitle);
          const questStatusId = await stackupContract.playerQuestStatuses(
            currentAccount,
            thisQuestId
          );
          thisQuestStatus.push(questStatusMapping[questStatusId]);

          userQuestStatuses.push(thisQuestStatus);
        }
        setUserQuestStatuses(userQuestStatuses);
      }
    } catch (err) {
      console.log("getUserQuestStatuses error...");
      console.log(err);
    }
  };

  const joinQuestHandler = async () => {
    try {
      if (!questId) {
        alert("input quest ID before proceeding");
      } else {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const stackupContract = new ethers.Contract(contractAddr, abi, signer);
        const tx = await stackupContract.joinQuest(questId);
        await tx.wait();
      }
    } catch (err) {
      console.log(err);
      alert("error encountered! refer to console log to debug");
    }
  };

  const submitQuestHandler = async () => {
    try {
      if (!questId) {
        alert("input quest ID before proceeding");
      } else {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const stackupContract = new ethers.Contract(contractAddr, abi, signer);
        console.log(submission, questId);
        const tx = await stackupContract.submitQuest(questId, submission);
        console.log(submission, questId);
        await tx.wait();
      }
    } catch (err) {
      console.log(err);
      alert("error encountered! refer to console log to debug");
    }
  };

  const createQuestHandler = async () => {
    try {
      if (!questTitle || questReward === 0 || numberOfRewards === 0) {
        alert("Please enter all quest details");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const stackupContract = new ethers.Contract(contractAddr, abi, signer);
      const tx = await stackupContract.createQuest(questTitle, questReward, numberOfRewards);
      await tx.wait();

      console.log(numberOfRewards);

      // Clear the input fields after successful quest creation
      setQuestTitle("");
      setQuestReward(0);
      setNumberOfRewards(0);

      // Refresh quests information
      getQuestsInfo();
    } catch (err) {
      console.log(err);
      alert("Error creating quest. Please check the console log for more details.");
    }
  };

  const reviewQuestHandler = async () => {
    try {
      if (!playerAddr || status === 0) {
        alert("Please select a player address and set a status.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const stackupContract = new ethers.Contract(contractAddr, abi, signer);

      // Call the reviewQuest function from the smart contract
      const tx = await stackupContract.reviewQuest(questId, status, playerAddr);
      await tx.wait();

      // Perform any additional logic or UI updates after reviewing the quest.
      // For example, you can fetch the updated quest details or refresh the list.
    } catch (err) {
      console.log(err);
      alert("Error encountered! Refer to the console log to debug.");
    }
  };

  useEffect(() => {
    getAdminAddr();
    getQuestsInfo();
    getUserQuestStatuses();
    if (questId !== "" && isAdmin) {
      getQuestSubmissions(questId);
    }
  });

  return (
    <div className="container">
      <h1>Build Your First Dapp</h1>
      <h4>By: Djorro</h4>
      {currentAccount ? (
        <h4>Wallet connected: {currentAccount}</h4>
      ) : (
        <button onClick={connectWalletHandler}>Connect Wallet</button>
      )}
      <h4>Admin address: {adminAddr}</h4>
      {isAdmin && (
        <>
          <h4>Admin address: {adminAddr}</h4>
          <h2>
            <u>Actions for Admin:</u>
          </h2>
          <h2>
            <u>Create Quest:</u>
          </h2>
          <div className="form">
            <div className="form-item">
              <label>Title: </label>
              <input
                type="text"
                placeholder="Quest Title"
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
              />
            </div>
            <div className="form-item">
              <label>Reward: </label>
              <input
                type="number"
                placeholder="Reward"
                value={questReward}
                onChange={(e) => setQuestReward(parseInt(e.target.value))}
              />
            </div>
            <div className="form-item">
              <label>Number of Rewards: </label>
              <input
                type="number"
                placeholder="Number of Rewards"
                value={numberOfRewards}
                onChange={(e) => setNumberOfRewards(parseInt(e.target.value))}
              />
            </div>
            <button onClick={createQuestHandler}>Create Quest</button>
          </div>
        </>
      )}

      <h2>
        <u>All Quests:</u>
      </h2>

      <div>
        {allQuestsInfo &&
          allQuestsInfo.map((quest) => {
            return (
              <div key={quest[0]}>
                <h4>{quest[2]}</h4>
                <ul>
                  <li>questId: {quest[0].toString()}</li>
                  <li>number of players: {quest[1].toString()}</li>
                  <li>reward: {quest[3].toString()}</li>
                  <li>number of rewards available: {quest[4].toString()}</li>
                </ul>
              </div>
            );
          })}
      </div>
      {!isAdmin && (
        <>
          <h2>
            <u>Your Quest Statuses:</u>
          </h2>
          <div>
            <ul>
              {userQuestStatuses &&
                userQuestStatuses.map((quest) => {
                  return (
                    <div key={quest[0]}>
                      <li>
                        {quest[0]} - {quest[1]}
                      </li>
                    </div>
                  );
                })}
            </ul>
          </div>
        </>
      )}

      <h2>
        <u>Actions:</u>
      </h2>
      <div>
        <input
          type="text"
          placeholder="Quest Id"
          value={questId}
          onChange={(e) => setQuestId(e.target.value)}
        />
        {!isAdmin && (
          <>
            <input
              type="text"
              placeholder="Your Submission"
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
            />
          </>
        )}
        {!isAdmin && (
          <>
            <button onClick={joinQuestHandler}>Join Quest</button>
            <button onClick={submitQuestHandler}>Submit Quest</button>
          </>
        )}
      </div>

      {isAdmin && (
        <>
          <h2>
            <u>Quest Submissions:</u>
          </h2>
          <h3>
            <u>Quest Id {questId}</u>
          </h3>
          <div>
            <p>Please input quest ID in action section to show Submission:</p>
            <ol>
              {submissions.map((submission, index) => (
                <li key={index}>
                  <div>Player: {submission.player}</div>
                  <div>Submission: {submission.submission}</div>
                </li>
              ))}
            </ol>
          </div>
          <h2>
            <u>Review Submissions & Quest:</u>
          </h2>
          <div>
            <div className="form">
              <div className="form-item">
                <label>Quest ID: </label>
                <input
                  type="number"
                  placeholder="Quest Id"
                  value={questId}
                  onChange={(e) => setQuestId(e.target.value)}
                />
              </div>
              <div className="form-item">
                <label>Player Address: </label>
                <input
                  type="string"
                  placeholder="0xf39Fd6e51aa"
                  value={playerAddr}
                  onChange={(e) => setPlayerAddr(e.target.value)}
                />
              </div>
              <div className="form-item-radio">
                <label>Status: </label>
                <label>
                  <input
                    type="radio"
                    name="status"
                    id="status"
                    value="3"
                    checked={status === "3"}
                    onChange={onOptionChange}
                  />
                  Rejected
                </label>
                <label>
                  <input
                    type="radio"
                    name="status"
                    id="status"
                    value="4"
                    checked={status === "4"}
                    onChange={onOptionChange}
                  />
                  Approved
                </label>
                <label>
                  <input
                    type="radio"
                    name="status"
                    id="status"
                    value="5"
                    checked={status === "5"}
                    onChange={onOptionChange}
                  />
                  Rewarded
                </label>
              </div>
              <button onClick={reviewQuestHandler}>Submit Review</button>
            </div>
          </div>
        </>
      )}
      <footer></footer>
    </div>
  );
}

export default App;
