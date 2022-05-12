import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {Program, Provider, web3} from "@project-serum/anchor";
import idl from "./idl.json"
import './App.css';
import kp from "./keypair.json"
import { useState, useEffect } from 'react';

const {SystemProgram, Keypair} = web3;
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');

const opts = {
  preflightCommitment: "processed"
}

const TEST_GIFS = [
  "https://i.gifer.com/4Mj.gif",
  "https://i.gifer.com/H9N.gif",
  "https://i.gifer.com/47tt.gif",
  "https://i.gifer.com/4N2.gif",
  "https://i.gifer.com/4N0.gif",
  "https://i.gifer.com/Aog.gif"
]

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState([]);
	const checkIfWalletIsConnected = async () => {
		try{
			const {solana} = window;
			if(solana){
				if(solana.isPhantom){
					console.log("Phantom Wallet Found");
					const response = await solana.connect({onlyIfTrusted : true});
					console.log("connected with public key", response.publicKey.toString());
					setWalletAddress(response.publicKey.toString())
				}
			} else {
				alert("Solana object not found! Get a Phantom Wallet")
			}
		} catch(err){
			console.log(err);
		}
	}

	const connectWallet = async () => {
		const {solana} = window;
		if(solana){
			const response = await solana.connect();
			console.log("connected with public key", response.publicKey.toString());
			setWalletAddress(response.publicKey.toString())
		}
	}
  const sendGif = async() => {
    if(inputValue.length > 0){
      try{
        const provider = getProvider();
        const program = new Program(idl, programID, provider);
        await program.rpc.addGif(
          inputValue,{
            accounts:{
              baseAccount: baseAccount.publicKey,
              user: provider.wallet.publicKey,
            }
          }
        )
        console.log("GIF successfully send to program", inputValue)
        await getGifList();
        console.log("gifLink: ", inputValue);
      }catch(error){
        console.log("ERROR SEND GIF :: ",error);
      }
      setInputValue('');
    } else {
      console.log('Empty Input');
    }
  }
  const handleInput = (event) => {
    setInputValue(event.target.value);
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new Provider(connection, window.solana, opts.preflightCommitment)
    return provider;
  }

  const createGifAccount = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.startStuffOff({
        accounts:{
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log("new account created",baseAccount.publicKey.toString());
      await getGifList();
    }catch (error){
      console.log(error);
    }
  }

  const renderConnectedContainter = () => {
    if(gifList === null){
      return <div className="connected-container">
        <button className="cta-button submit-gif-button"
          onClick={createGifAccount}
        >
          Do one-time Initialization for GIF Program Account
        </button>
      </div>
    } else {
      return (<div className="connected-container">
      <form
        onSubmit={event => {event.preventDefault(); sendGif()}}>
        <input type="text" placeholder="Enter gif link here!" value={inputValue} onChange={handleInput}/>
        <button type="submit" className="cta-button submit-gif-button">Submit</button>
      </form>
      <div className="gif-grid">
        {gifList.map((item, index)=>(
          <div className="gif-item" key={index}>
            <img src={item.gifLink} alt={item.gifLink} />
          </div>
        ))}
      </div>
    </div>
      )
    }
  }

  const renderNotConnectedContainter = () => (
		<button
			className="cta-button connect-wallet-button"
			onClick={connectWallet}
		>
			Connect To Wallet
		</button>
	);
	useEffect(()=>{
		const onLoad = async() => {
			await checkIfWalletIsConnected();
		}
		window.addEventListener('load',onLoad);
		return () => window.removeEventListener('load', onLoad);
	}, [])
  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)
      
      console.log("got the account", account);
      setGifList(account.gifList);
    }catch(err){
      console.log("ERROR :: ", err);
      setGifList(null)
    }
  }
  useEffect(()=>{
    if(walletAddress){
      console.log("Fetching Gif List... ");
      getGifList();
      setGifList(TEST_GIFS)
    }
  },[walletAddress])
  return (
    <div className="App">
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainter()}
          {walletAddress && renderConnectedContainter()}
        </div>
      </div>
    </div>
  );
};

export default App;
