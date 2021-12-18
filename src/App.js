import React, { useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl, Keypair} from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json';
import kp from './keypair.json';


// const { SystemProgram, Keypair } = web3;
const { SystemProgram } = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done"
const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = 'sawyermidddd';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// const RAINBOW_COLORS = ['#ff0000','#ffa500','#ffff00','#008000','#0000ff','#4b0082','#ee82ee']

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [colorList, setColorList] = useState([]);

  // Actions
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );


          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
  
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendColor = async () => {
    const hexre = new RegExp('/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i');

    if ((inputValue.length === 0) || (hexre.test(inputValue))) {
      return
    }
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addColor(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
  
      await getColorList();
    } catch (error) {
      console.log("Error sending color code:", error)
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createColorAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getColorList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    if (colorList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-color-button" onClick={createColorAccount}>
            Do One-Time Initialization For color Program Account
          </button>
        </div>
      )
    } 
    // Account exists. User can submit colors.
    else {
      return(
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendColor();
            }}
          >
            <input
              class='color-input'
              type="text"
              placeholder="Add a color (hex code)"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-color-button">
              Submit
            </button>
          </form>
          <div className="color-grid">
            {colorList.map((item, index) => (
              <div className="color-item" key={index} style={{backgroundColor:item.colorCode}}>
                <p class="color-code">{item.colorCode}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  // UseEffects
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const getColorList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      setColorList(account.colorList)
  
    } catch (error) {
      console.log("Error in getColorList: ", error)
      setColorList(null);
    }
  }
  
  useEffect(() => {
    if (walletAddress) {
      getColorList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
			<div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">Infinite Rainbow (Live on Devnet!)</p>
          <p className="sub-text">
            A digital rainbow created by people of the world on the Solana blockchain. 
          </p>
          <p>
          Check out our <a href="https://explorer.solana.com/address/CX3B1Cy76tCXBWsf1njTHHvKivicW2NgPBATKp6Dqs82?cluster=devnet">Program Account</a>.
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by Sawyer Middeleer`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;