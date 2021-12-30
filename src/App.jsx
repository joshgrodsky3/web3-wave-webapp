import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json"

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = "0x1C5cC3b13f9EBE6fb574fe2Fb69AC4DAa9E286fD"
  const accounts = []
  const contractABI = abi.abi

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);

        await getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    let wavePortalContract;

  const onNewWave = (from, timestamp) => {
      console.log("NewWave", from, timestamp, );
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        try {
          var elt = document.getElementById('waveTotal')
          elt.remove()
        } catch (error) {
          console.log('Total not displayed yet.')
        }
        /*
        * Execute the actual wave from your smart contract
        */
        //add userinput here
        const waveTxn = await wavePortalContract.wave({ gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);
        
        displayLoading();
        await hashButton(waveTxn.hash);
        
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        try {
          if(waveTxn)
          {
            var elt = document.getElementById('image')
            elt.remove()
            elt = document.getElementById('loadText')
            elt.remove()
          }
          
        } catch (error) {
          console.log(error)
        }

        await getAllWaves();
        
        

        let count = await wavePortalContract.getTotalWaves();
        let accCount = await wavePortalContract.getTotalAccounts();
        
        showAccountWaves(await wavePortalContract.getAccountWaves(currentAccount))
        addWaveDiv(count, accCount);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const showAccountWaves = async(count) => {
        var waveDiv = document.querySelector('.waveButton');
        var accountWaveDiv = document.createElement('div');
        accountWaveDiv.setAttribute('id','waveTotal');
        accountWaveDiv.innerHTML = "You have waved at me " + count+ " times."
        accountWaveDiv.style.cssText = "text-align: center;color: rgb(75, 75, 75);margin-top: 16px;"
        waveDiv.insertAdjacentElement('afterend', accountWaveDiv)
  }

  const displayLoading = async () => {
        var waveDiv = document.querySelector('.waveButton');
        var loadingImg = document.createElement('img');
        loadingImg.setAttribute('id','image');
        loadingImg.setAttribute('src', 'https://ursavote.netlify.app/static/media/loading.de1e7762.gif')
        waveDiv.insertAdjacentElement('afterend', loadingImg)

        var loadingText = document.createElement('div');
        loadingText.setAttribute('id','loadText');
        loadingText.innerHTML = "Mining... This may take a few minutes."
        loadingText.style.cssText = "text-align: center;color: rgb(75, 75, 75);margin-top: 16px;"
        waveDiv.insertAdjacentElement('afterend', loadingText)
  }

  const addWaveDiv= async (count, accCount) => {
        var waveDiv = document.querySelector('.waveButton');
        var waveTotalDiv = document.createElement('div');
        waveTotalDiv.setAttribute('id','waveTotal');
        waveTotalDiv.innerHTML = "I have been waved at " + count + " times by " + accCount + " unique addresses."
        waveTotalDiv.style.cssText = "text-align: center;color: rgb(75, 75, 75);margin-top: 16px;"
        waveDiv.insertAdjacentElement('afterend', waveTotalDiv)
  }

  const hashButton = async (hash) => {
        //if button exists change hash link
        var checkHashButton = document.getElementById('hashButton')
        if(checkHashButton)
        {
          console.log('hash button already exists')
            checkHashButton.setAttribute(
            'onClick',
            `window.open('https://rinkeby.etherscan.io/tx/${hash}')`
          );
        }
        else {
          var waveDiv = document.querySelector('.waveButton');
          var hashButton = document.createElement('button');
          hashButton.setAttribute("class", "waveButton")
          hashButton.setAttribute("id", "hashButton")
          hashButton.setAttribute(
            'onClick',
            `window.open('https://rinkeby.etherscan.io/tx/${hash}')`
          );
          hashButton.setAttribute('id','hashButton');
          hashButton.innerHTML = "View Transaction on Etherscan"
          //hashButton.style.cssText = "text-align: center;color: rgb(75, 75, 75);margin-top: 16px;"
          waveDiv.insertAdjacentElement('afterend', hashButton)
        }
        
  }

  

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

    return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
          I'm Josh and I've worked on test automation for the future of shipping so that's pretty cool right? Connect your Ethereum wallet and wave at me!
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        
        {allWaves.map((wave, index) => {
          
          if(index === (allWaves.length-1))
          {
            return (
            <div id='waveDetails' key={index} className="waveDetails">
              <div className="divHeader">Your last wave details</div>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
            </div>)
          }
          
        })}
      </div>
    </div>
  );
}

export default App