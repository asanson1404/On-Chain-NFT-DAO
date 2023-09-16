import {  XelaCollectionNFTAddress, XelaCollectionNFTABI, 
          XelaDAOAddress, XelaDAOABI,
          WhitelistAddress, WhitelistABI, 
} from '../constants'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { formatEther, parseEther } from 'viem'
import { useAccount, useBalance, useConnect, useContractRead } from 'wagmi'
import { readContract, waitForTransaction, writeContract } from 'wagmi/actions'
import styles from '../styles/Home.module.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap', });

export default function Home() {

  // Check if the users's wallet is connected or disconnected, store its address (Wagmi hooks) 
  const { address, isConnected } = useAccount();

  // State variable to know if the Component has been mounted yet or not
  const [isMounted, setIsMounted] = useState(false);

  // State variable to show loading state when waiting for a transaction to go through
  const [loading, setLoading] = useState(false);

  // State variable to show loading state when waiting for a transaction to go through
  const [minting, setMinting] = useState(false);

  // State variable to show loading state when waiting for a transaction to go through
  const [joining, setJoining] = useState(false);

  // State variable to know if the fake token ID is invalid
  const [createProposalError, setCreateProposalError] = useState(false);
  // Use effect to display the error message only 3 seconds
  useEffect(() => {
    if(createProposalError === true) {
      const timer = setTimeout(() => {
        setCreateProposalError(false)
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [createProposalError]);

  // State variable to store all proposals in the DAO
  const [proposals, setProposals] = useState([]);
  // State variable to know if the proposals are fetching
  const [loadProposals, setLoadProposals] = useState(false);
  // Wait 2.5 seconds before displaying the "no proposals" message
  useEffect(() => {
    if(loadProposals === true) {
      const timer = setTimeout(() => {
        setLoadProposals(false)
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loadProposals]);

  // Fake NFT token ID to purchase. Used when creating a proposal.
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");

  // State variable to switch between 'Create Proposal' and 'View Proposals' tabs
  const [selectedTab, setSelectedTab] = useState("");

  // Number of Xela Collection NFTs
  const maxTokenIds = Number(14);

  // Fetch the number of reserved tokens
  const nbTokenMinted = useContractRead({
    address: XelaCollectionNFTAddress,
    abi: XelaCollectionNFTABI,
    functionName: 'totalSupply',
    watch: true,
  })

  // Fetch the number of reserved tokens (whitelisted tokens)
  const reservedTokens = useContractRead({
    address: XelaCollectionNFTAddress,
    abi: XelaCollectionNFTABI,
    functionName: 'reservedTokens',
    watch: true,
  })

  // Fetch the number of reserved tokens claimed (whitelisted tokens claimed)
  const reservedTokensClaimed = useContractRead({
    address: XelaCollectionNFTAddress,
    abi: XelaCollectionNFTABI,
    functionName: 'reservedTokensClaimed',
    watch: true,
  })

  // Fetch the number of NFT the user owns
  const nftUserBalance = useContractRead({
    address: XelaCollectionNFTAddress,
    abi: XelaCollectionNFTABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  })

  // Determine if the user is whitelisted or not
  const whitelisted = useContractRead({
    address: WhitelistAddress,
    abi: WhitelistABI,
    functionName: 'whitelistedAddresses',
    args: [address],
    watch: true,
  })

  // Fetch the owner of the DAO and the NFT Collection
  const daoOwner = useContractRead({
    address: XelaDAOAddress,
    abi: XelaDAOABI,
    functionName: 'owner',
  });

  // Fetch the balance of the DAO
  const daobalance = useBalance({
    address: XelaDAOAddress,
    watch: true,
  });

  // Fetch the number of proposal in the DAO
  const nbProposals = useContractRead({
    address: XelaDAOAddress,
    abi: XelaDAOABI,
    functionName: 'numProposals',
    watch: true,
  });

  // JSX - Function to join the whitelist (only 4 seats available)
  async function joinWhitelist() {

    setJoining(true);

    try {
      const hash = await writeContract({
        address: WhitelistAddress,
        abi: WhitelistABI,
        functionName: 'addAddressToWhitelist',
      });
      await waitForTransaction(hash);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }

    setJoining(false);
  }

  // JSX - Function to mint a Xela NFT
  async function mintXelaNFT() {

    setMinting(true);
    
    if(Boolean(whitelisted.data) && Number(nftUserBalance.data) === 0) {
      try {
        const hash = await writeContract({
          address: XelaCollectionNFTAddress,
          abi: XelaCollectionNFTABI,
          functionName: 'mint',
          value: parseEther('0'),
        })
        await waitForTransaction(hash);
      } catch (error) {
        console.error(error);
        window.alert(error);
      }
    } 
    
    else {
      try {
        const hash = await writeContract({
          address: XelaCollectionNFTAddress,
          abi: XelaCollectionNFTABI,
          functionName: 'mint',
          value: parseEther('0.01'),
        })
        await waitForTransaction(hash);
      } catch (error) {
        console.error(error);
        window.alert(error);
      }
    }

    setMinting(false);
  }

  // Function to make a createProposal transaction in the DAO
  async function createProposal() {

    const inputElement = document.getElementById("createProposalInput");

    if (inputElement.value.trim() === "") {
      setCreateProposalError(true);
    }
    else {
      setCreateProposalError(false);
      setLoading(true);

      try {
        const hash = await writeContract({
          address: XelaDAOAddress,
          abi: XelaDAOABI,
          functionName: 'createProposal',
          args: [BigInt(fakeNftTokenId)],
        });
        await waitForTransaction(hash);
      } catch (error) {
        console.error(error);
        window.alert(error);
      }

      setLoading(false);
    }
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
        proposalId: Number(id),
        nftTokenIdToBuy: Number(nftTokenIdToBuy),
        deadline: new Date(Number(deadline) * 1000), // * 1000 because ethereum gives the time in seconds
        yesVote: Number(yesVote),
        noVote: Number(noVote),
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

      for(var i = 0; i < Number(nbProposals.data); i++) {
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
      const hash = await writeContract({
        address: XelaDAOAddress,
        abi: XelaDAOABI,
        functionName: 'voteOnProposal',
        args: [proposalId, vote === "YES" ? 0 : 1],
      });
      await waitForTransaction(hash);
    } catch (error) {
      console.error(error);
      window.alert(error);
    }

    setLoading(false);
    fetchAllProposals();
  }

  // Function to execute a proposal after deadline has been exceeded
  async function executeProposal(proposalId) {

    setLoading(true);

    try {
      const hash = await writeContract({
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
    else if (Number(nftUserBalance.data) === 0 ) {
      return (
        <div>
          <p>You don't own any Xela NFT. <br/>
          <b>You cannot create or vote on proposals</b></p>
          <p>{Number(nbTokenMinted.data)} tokens still available for purchase</p>
        </div>
      );
    } else {
      return (
        <div>
          <div className={styles.createProposalContainer}>
            <label>Fake NFT Token ID to Purchase: </label>
            <input id="createProposalInput" type="number" placeholder="Token ID to purchase"
              onChange={(e) => setFakeNftTokenId(e.target.value)}
            />
            <button onClick={() => createProposal()}>
              Create Proposal
            </button>
          </div>
          {createProposalError && (
              <p>Invalid NFT Token ID<br/>
              Must be a number</p>
          )}
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
    } else if ((proposals.length === 0) && !loadProposals) {
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
              <div className={styles.proposalId}><b>Proposal ID: {p.proposalId}</b></div>
              <p>Fake NFT to purchase: {p.nftTokenIdToBuy}</p>
              <p>Deadline: {p.deadline.toString().substring(0,25)}</p>
              <p>YES vote: {p.yesVote}</p>
              <p>NO vote: {p.noVote}</p>
              <p>Executed?: {p.executed ? "Yes" : "No"}</p>

              {/* If proposal's deadline not exceeded and proposal not executed */}
              {p.deadline > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  {/* VOTE YES BUTTON */}
                  <button className={styles.proposalActionButton} onClick={() => voteOnProposal(p.proposalId, "YES")}>
                    Vote YES
                  </button>
                  {/* VOTE NO BUTTON */}
                  <button className={styles.proposalActionButton} onClick={() => voteOnProposal(p.proposalId, "NO")}>
                    Vote NO
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  {/* Else if proposal's deadline exceeded and proposal not executed */}
                  {/* EXECUTE PROPOSAL BUTTON */}
                  <button className={styles.proposalActionButton} onClick={() => executeProposal(p.proposalId)}>
                    Execute Proposal {p.yesVote > p.noVote ? ("(YES)") : ("(NO)")}
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
      setLoadProposals(true);
      fetchAllProposals();
    }
  }, [selectedTab]);
  

  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) return null;

  // Display the RainbowKit Connect Button
  if (!isConnected) return (
    <div className={inter.className}>
      <div className={styles.connectButton}>
        <h1>Connect your wallet to enter in the <span className={styles.xelaDaoColor}>Xela DAO</span></h1><br/>
        <div><ConnectButton /></div>
      </div>
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
          <h1 className={styles.title}>Welcome to <span className={styles.xelaDaoColor}>Xela DAO</span></h1>
          <h3 className={styles.walletaddr}>Wallet address: {address.toString()}</h3>
          <div className={styles.userBalanceDiv}>
            Your Xela NFT balance: {Number(nftUserBalance.data)}<br/>
            <div className={styles.flexMint}>
              {reservedTokens.data !== reservedTokensClaimed.data ? (
                <>
                  {joining ? (
                    <button>Joining...</button>
                  ) : (
                    <button onClick={() => joinWhitelist()}>Join Whitelist</button>
                  )}
                  {minting ? (
                    <button>Minting...</button>
                  ) : (
                    <button onClick={() => mintXelaNFT()}>Mint Xela NFT</button>
                  )}
                </>
              ) : (
                <>
                  {minting ? (
                    <button>Minting...</button>
                  ) : (
                    <button onClick={() => mintXelaNFT()}>Mint Xela NFT</button>
                  )}
                </>
              )}
            </div>
          </div>
          <div>
            {daobalance.data && (
              <div>
                DAO's Treasury Balance:{" "}<b>{formatEther(Number(daobalance.data.value))} ETH</b>
              </div>
            )} <br/>
            Total number of Proposals: {Number(nbProposals.data)}
          </div>
          <div className={styles.flexProposal}>
            <button onClick={() => setSelectedTab("Create Proposal")}>
              Create Proposal
            </button>
            <button onClick={() => setSelectedTab("View Proposals")}>
              View Proposals
            </button>
          </div>
          {renderTabs()}

        </div>
        {daobalance.data && (
              <>
                DAO's Treasury Balance:{" "}
                {formatEther(daobalance.data.value).toString()} ETH
                RESERVED TOKENS = {reservedTokens.data}
                RESERVED TOKENS CLAIMED = {reservedTokensClaimed.data}<br/>
                whitelisted : {Boolean(whitelisted.data).toString()}
                NB TOKEN MINTED : {Number(nbTokenMinted.data)}
                
              </>
            )} <br/>
        <div>
          <img className={styles.image} src="https://i.imgur.com/buNhbF7.png" />
        </div>
      </div>
    </div>
  );
}
