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

  // Number of Xela Collection NFTs
  const maxTokenIds = 14;

  // Fetch the number of reserved tokens
  const nbTokenMinted = useContractRead({
    ddress: XelaCollectionNFTAddress,
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
    watch: true
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
            <div>
              {reservedTokens.data !== reservedTokensClaimed.data ? (
                <>
                  {joining ? (
                    <button className={styles.boutonAligne}>Joining...</button>
                  ) : (
                    <button className={styles.boutonAligne} onClick={() => joinWhitelist()}>Join Whitelist</button>
                  )}
                  {minting ? (
                    <button className={styles.boutonAligne}>Minting...</button>
                  ) : (
                    <button className={styles.boutonAligne} onClick={() => mintXelaNFT()}>Mint Xela NFT</button>
                  )}
                </>
              ) : (
                <>
                  {minting ? (
                    <button className={styles.boutonSeul}>Minting...</button>
                  ) : (
                    <button className={styles.boutonSeul} onClick={() => mintXelaNFT()}>Mint Xela NFT</button>
                  )}
                </>
              )}
            </div>



            
          </div>
            {
              Number(nftUserBalance.data) === 0 && Number(nbTokenMinted.data) !== maxTokenIds && (
                <div>
                  {loading ? (
                    <button >Minting...</button>
                  ) : (
                    <button>
                      Mint Xela NFT
                    </button>
                  )}
                </div>
              )
            }
            {daobalance.data && (
              <>
                DAO's Treasury Balance:{" "}
                {formatEther(daobalance.data.value).toString()} ETH
                RESERVED TOKENS = {reservedTokens.data}
                RESERVED TOKENS CLAIMED = {reservedTokensClaimed.data}<br/>
                whitelisted : {Boolean(whitelisted.data).toString()}
              </>
            )} <br/>



        </div>
        <div>
          <img className={styles.image} src="https://i.imgur.com/buNhbF7.png" />
        </div>
      </div>
    </div>
  );
}
