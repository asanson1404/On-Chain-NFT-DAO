import { XelaCollectionNFTAddress, XelaCollectionNFTABI, XelaDAOAddress, XelaDAOABI } from '../constants'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { formatEther } from 'viem'
import { useAccount, useBalance, useConnect, useContractRead, useDisconnect } from 'wagmi'
import { readContract, waitForTransaction, writeContract } from 'wagmi/actions'
import styles from '../styles/Home.module.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap', });

export default function Home() {

  // Check if the users's wallet is connected or disconnected, store its address (Wagmi hooks) 
  const { address, isConnecting, isConnected, isDisconnected } = useAccount();

  // State variable to know if the Component has been mounted yet or not
  const [isMounted, setIsMounted] = useState(false);

  // State variable to show loading state when waiting for a transaction to go through
  const [loading, setLoading] = useState(false);

  // Fake NFT token ID to purchase. Used when creating a proposal.
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  // State variable to store all proposals in the DAO
  const [proposals, setProposals] = useState([]);
  // State variable to switch between 'Create Proposal' and 'View Proposals' tabs
  const [selectedTab, setSelectedTab] = useState("");

  // Number of Xela Collection NFTs
  const maxTokenIds = 14;

  // Fetch the number of reserved tokens
  const nbTokenMinted = useContractRead({
    ddress: XelaCollectionNFTAddress,
    abi: XelaCollectionNFTABI,
    functionName: 'totalSupply',
  })

  // Fetch the owner of the DAO and the NFT Collection
  const { daoOwner, isError } = useContractRead({
    address: XelaDAOAddress,
    abi: XelaDAOABI,
    functionName: 'owner',
  });

  // Fetch the balance of the DAO
  const daobalance = useBalance({
    address: XelaDAOAddress,
  });

  // Fetch the number of proposal in the DAO
  const nbProposals = useContractRead({
    address: XelaDAOAddress,
    abi: XelaDAOABI,
    functionName: 'numProposals',
  });

  // Fetch the NFTs balance of a user
  const nftUserBalance = useContractRead({
    address: XelaCollectionNFTAddress,
    abi: XelaCollectionNFTABI,
    functionName: 'balanceOf',
    args: [address],
  });


  // Function to make a createProposal transaction in the DAO
  async function createProposal() {

    setLoading(true);

    try {
      const hash = await writeContract({
        address: XelaDAOAddress,
        abi: XelaDAOABI,
        functionName: 'createProposal',
        args: [fakeNftTokenId],
      });
      await waitForTransaction(hash);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }

    setLoading(false);
  } 

  // Function to fetch a proposal bi its ID
  async function fetchProposalById(id) {
    try {
      const proposal = await readContract({
        address: XelaDAOAddress,
        abi: XelaDAOABI,
        functionName: 'proposals',
        args: [id],
      })

      const [nftTokenIdToBuy, yesVote, noVote, deadline, executed] = proposal;

      const parsedProposal = {
        proposalId: id,
        nftTokenIdToBuy: nftTokenIdToBuy,
        deadline: new Date(parseInt(deadline.toString()) * 1000),
        yesVote: yesVote.toString(),
        noVote: noVote.toString(),
        executed: Boolean(executed),
      };

      return parsedProposal;

    } catch(error) {
      console.error(error);
      window.alert(error);
    }
  }

  // Function to fetch all the proposals in the DAO
  async function fetchAllProposals() {

    try {
      const proposals = []

      for(i = 0; i < nbProposals.data; i++) {
        const p = await fetchProposalById(i);
        proposals.push(p)
      }

      setProposals(proposals);
      return proposals;
    } catch(error) {
      console.error(error);
      window.alert(error);
    }
  }

  // Function to vote YES or NO on a proposal
  async function voteOnProposal(proposalId, vote) {

    setLoading(true);

    try {
      const hash = writeContract({
        address: XelaDAOAddress,
        abi: XelaDAOABI,
        functionName: 'voteOnProposal',
        args: [proposalId, vote === "YES" ? 0 : 1],
      });
      await waitForTransaction(hash);
    } catch(error) {
      console.error(error);
      window.alert(error);
    }

    setLoading(false);
  }

  // Function to execute a proposal after deadline has been exceeded
  async function executeProposal(proposalId) {
    setLoading(true);

    try {
      const hash = writeContract({
        address: XelaDAOAddress,
        abi: XelaDAOABI,
        functionName: 'executeProposal',
        args: [proposalId],
      });
      await waitForTransaction(hash);
    } catch(error) {
      console.error(error);
      window.alert(error);
    }

    setLoading(false);
  }

  // Function to withdraw ethers from the DAO contract
  async function withdrawDAOEther() {
    setLoading(true);

    try {
      const hash = writeContract({
        address: XelaDAOAddress,
        abi: XelaDAOABI,
        functionName: 'withdrawEthers',
      });
      await waitForTransaction(hash);
    } catch(error) {
      console.error(error);
      window.alert(error);
    }

    setLoading(false);
  }

  // JSX - Function to render the content of the appropriate tab (Create Proposal or View Proposal)
  // Based on the value of the selectedTab hook
  function renderTabs() {
    if(selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  // Render the Create Proposal Tab content
  function renderCreateProposalTab() {
    if(loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction
        </div>
      );
    }
    else if (nftUserBalance.data === 0 ) {
      const nbRemainingTokens = (maxTokenIds - nbTokenMinted).toString();
      return (
        <div className={styles.description}>
          You don't own any Xela NFT. <br/>
          <b>You cannot create or vote on proposal</b><br/>
          <span id="nbRemainingTokens"></span> seats left on the DAO.
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>Fake NFT Token ID to Purchase: </label>
          <input
            placeholder="0"
            type="number"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
          />
          <button className={styles.button2} onClick={createProposal}>
            Create Proposal
          </button>
        </div>
      );
    }
  }

  // Render the View Proposals Tab content
  function renderViewProposalsTab() {
    if(loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>
          No proposals have been created
        </div>
      );
    } else {
      return (
        <div>

          {proposals.map((p, index) => (
            <div key={index} className={styles.card}>
              <p>Proposal ID: {p.proposalId}</p>
              <p>Fake NFT to purchase: {p.nftTokenIdToBuy}</p>
              <p>Deadline: {p.deadline.toLocaleString()} to verify</p>
              <p>YES vote: {p.yesVote}</p>
              <p>NO vote: {p.noVote}</p>
              <p>Executed?: {p.executed.toString()}</p>

              {/* If proposal's deadline not exceeded and proposal not executed */}
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  {/* VOTE YES BUTTON */}
                  <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId, "YES")}>
                    Vote YES
                  </button>
                  {/* VOTE NO BUTTON */}
                  <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId, "NO")}>
                    Vote NO
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  {/* Else if proposal's deadline exceeded and proposal not executed */}
                  {/* EXECUTE PROPOSAL BUTTON */}
                  <button className={styles.button2} onClick={() => executeProposal(p.proposalId)}>
                    Execute Proposal{" "}{p.yayVotes > p.nayVotes ? "(YES)" : "(NO)"}
                  </button>
                </div>
              ) : (
                <div className={styles.description}>
                  Proposal Executed
                </div>
              )}
            </div>
          ))}       
        </div>
      );
    }
  }

  // Code that runs every time the value of 'selectedTab' changes
  // Use Effect used to re-fetch all proposals when the user switch to 
  // 'View Proposals' tab
  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) return null;

  // Display the RainbowKit Connect Button
  if (!isConnected) return (
    <div>
      <ConnectButton />;
    </div>
  );

  return (
    <div className={inter.className}>
      <Head>
        <title>Xela DAO</title>
        <meta name="description" content="Xela DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Xela DAO</h1>
          <div className={styles.description}>Your Xela NFT balance: {nftUserBalance.data.toString()}<br/>
            {daobalance.data && (
              <>
                Treasury Balance:{" "}
                {formatEther(daobalance.data.value).toString()} ETH
              </>
            )} <br/>
            Total number of Proposals: {nbProposals.data.toString()}
          </div>
          <div className={styles.flex}>
            {/* CREATE PROPOSAL BUTTON */}
            <button className={styles.button} onClick={() => setSelectedTab("Create Proposal")}>
              Create Proposal
            </button>
            {/* VIEW PROPOSALS BUTTON */}
            <button className={styles.button} onClick={() => setSelectedTab("View Proposals")}>
              View Proposals
            </button>
          </div>
          {renderTabs()}

          {/* Display additional withdraw button if connected wallet is owner */}
          {address.toLowerCase() === daoOwner.data.toLowerCase() ? (
            <div>
              {loading ? (
                <button className={styles.button}>Loading...</button>
              ) : (
                <button className={styles.button} onClick={() => withdrawDAOEther}>
                  Withdraw DAO ETH
                </button>
              )}
            </div>
          ) : (
            ""
          )}
        </div>
        <div>
          <img className={styles.image} src="https://i.imgur.com/buNhbF7.png" />
        </div>
      </div>
    </div>
  );
}
