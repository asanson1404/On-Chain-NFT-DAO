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

  // Number of Xela Collection NFTs
  const maxTokenIds = 14;

  // Fetch the number of reserved tokens
  const nftUserBalance = useContractRead({
    address: XelaCollectionNFTAddress,
    abi: XelaCollectionNFTABI,
    functionName: 'balanceOf',
    args: [address]
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
  });


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
          <h1 className={styles.title}>Welcome to Xela DAO</h1>
          {console.log(Number(nftUserBalance.data))}
          {console.log(address)}
          <div className={styles.description}>Your Xela NFT balance: {Number(nftUserBalance.data)}<br/>
            {daobalance.data && (
              <>
                Treasury Balance:{" "}
                {formatEther(daobalance.data.value).toString()} ETH
              </>
            )} <br/>
          </div>
          <div>
              Wallet address: {address.toString()}
          </div>


        </div>
        <div>
          <img className={styles.image} src="https://i.imgur.com/buNhbF7.png" />
        </div>
      </div>
    </div>
  );
}
