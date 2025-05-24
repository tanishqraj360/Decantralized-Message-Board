import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import MessageBoardArtifact from './MessageBoard.json';
import { CONTRACT_ADDRESS } from './config';

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState(null);


  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        setError("Make sure you have Metamask installed!");
        return;
      } else {
        console.log("Ethereum object found", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        initializeContract(ethereum);
      } else {
        console.log("No authorized account found");
        setError("Connect your Metamask wallet to use the DApp.");
      }
    } catch (err) {
      console.error("Error checking wallet connection: ", err);
      setError("Error connecting to wallet. Please check console.");
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        setError("Get Metamask!");
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);

      initializeContract(ethereum);
      setError('');
    } catch (err) {
      console.error("Error connecting wallet: ", err);
      setError("Failed to connect wallet. " + err.message);
    }
  };

  const initializeContract = async (ethereumProvider) => {
    try {
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      const messageBoardContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        MessageBoardArtifact.abi,
        signer
      );

      setContract(messageBoardContract);
      console.log("Contract initialized:", messageBoardContract);


      messageBoardContract.on("MessagePosted", (sender, content, timestamp) => {
        console.log("New message event received: ", { sender, content, timestamp: Number(timestamp) });

        setMessages((prevMessages) => [
          ...prevMessages,
          { sender, content, timestamp: Number(timestamp) }
        ]);
      });

      fetchAllMessages(messageBoardContract);
    } catch (err) {
      console.error("Error initializing contract: ", err);
      setError("Failed to load contract. Ensire correct network and address.");
    }
  };

  const postMessage = async () => {
    if (!contract) {
      setError("Contract not initialized. Please connect your wallet.");
      return;
    }

    if (!messageContent.trim()) {
      setError("Message cannot be empty!");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tx = await contract.postMessage(messageContent);
      console.log("Posting message... Transaction hash: ", tx.hash);

      await tx.wait();
      console.log("Message posted successfully!", tx.hash);

      setMessageContent('');
    } catch (err) {
      console.error("Error posting message: ", err);
      setError("Failed to post message. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMessages = async (messageBoardContractInstance) => {
    if (!messageBoardContractInstance) return;

    setLoading(true);
    setError('');

    try {
      const fetchedMessages = await messageBoardContractInstance.getAllMessages();
      console.log("Fetched messages: ", fetchedMessages);

      const formattedMessages = fetchedMessages.map(msg => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: Number(msg.timestamp)
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error("Error fetching messages: ", err);
      setError("Failed to fetch messages. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();

    if (window.etherum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          initializeContract(window.ethereum);
        } else {
          setCurrentAccount(null);
          setMessages([]);
          setContract(null);
          setError("Wallet disconnected. Please connect.");
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        console.log("Network changed to: ", chainId);
        setError("Network changed. Please ensure you are on the correct network (Hardhat Localhost).");
        setCurrentAccount(null);
        setMessages([]);
        setContract(null);
      });
    }

    return () => {
      if (contract) {
        contract.off("MessagePosted");
      }
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => { });
        window.ethereum.removeListener('chainChanged', () => { });
      }
    };
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 text-white flex flex-col items-center py-10 font-inter'>
      <div className='bg-gray-800 bg-opacity-70 p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-purple-600'>
        <h1 className='text-4xl font-bold text-center mb-6 text-purple-300'>Decentralized Message Board</h1>

        {error && (
          <div className='bg-red-500 bg-opacity-80 text-white p-3 rounded-lg mb-4 text-center'>
            {error}
          </div>
        )}

        {!currentAccount ? (
          <div className='text-center'>
            <p className='mb-4 text-lg'>Connect your wallet to post and view messages.</p>
            <button onClick={connectWallet}
              className='bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75'
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            <p className='text-center text-lg mb-6'>
              Connected Account: <span className='font-mono text-purple-400'>{currentAccount.substring(0, 6)}...{currentAccount.substring(currentAccount.length - 4)}</span>
            </p>

            <div className='mb-8 p-6 bg-gray-700 bg-opacity-60 rounded-lg shadow-inner border border-gray-600'>
              <h2 className='text-2xl font-semibold mb-4 text-purple-200'>Post a New Message</h2>
              <textarea className='w-full p-3 mb-4 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none'
                rows="3"
                placeholder="What's on your mind?"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                disabled={loading}
              ></textarea>
              <button
                onClick={postMessage}
                className='w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={loading || !messageContent.trim()}
              >
                {loading ? 'Posting...' : 'Post Message'}
              </button>
            </div>
            <div className='p-6 bg0gray-700 bg-opacity-60 rounded-lg shado-inner border border-gray-600'>
              <h2 className='text-2xl font-semibold mb-4 text-purple-200'>All Messages</h2>
              {loading && messages.length === 0 && (
                <p className='text-center text-purple-400'>No messages yet. Be the first to post!</p>
              )}
              <div className='space-y-4'>
                {messages.slice().reverse().map((msg, index) => (
                  <div key={index} className='bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700'>
                    <p className='text-gray-300 text-sm mb-1'>
                      From: <span className='font-mono text-purple-400'>{msg.sender.substring(0, 6)}...{msg.sender.substring(msg.sender.length - 4)}</span>
                    </p>
                    <p className='text-lg text-white mb-2 break-words'>{msg.content}</p>
                    <p className='text-gray-400 text-xs'>
                      {new Date(msg.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
