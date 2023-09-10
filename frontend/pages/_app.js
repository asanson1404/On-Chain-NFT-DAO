import '@rainbow-me/rainbowkit/styles.css';
import '@/styles/globals.css';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { goerli, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains([goerli, sepolia], [publicProvider()]);

const { connectors } = getDefaultWallets({
  appName: "Xela DAO",
  projectId: "6e8e88ca2d45e9790c40e82dbe4462a5",
  chains: chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export default function App({ Component, pageProps }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
