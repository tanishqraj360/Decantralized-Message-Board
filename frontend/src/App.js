import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import MessageBoardArtifact from './MessageBoard.json';
import { CONTRACT_ADDRESS } from './config';

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState(null);

  const fetchAllMessages = useCallback(async (contractInstance) => {
    if (!contractInstance) return;

    setLoading(true);
    setError('');
    try {
      const fetchedMessages = await contractInstance.getAllMessages();
      const formatted = fetchedMessages.map(msg => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: Number(msg.timestamp),
      }));
      setMessages(formatted);
    } catch (err) {
      setError("Failed to fetch messages. " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Main app initialization
  useEffect(() => {
    const { ethereum } = window;
    if (!ethereum) {
      setError("Make sure you have MetaMask installed!");
      return;
    }

    const init = async () => {
      try {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);

          const provider = new BrowserProvider(ethereum);
          await provider.ready;
          const signer = await provider.getSigner();

          const instance = new Contract(
            CONTRACT_ADDRESS,
            MessageBoardArtifact.abi,
            signer
          );
          setContract(instance);
          setError('');
        } else {
          setCurrentAccount(null);
          setContract(null);
          setMessages([]);
          setError("Connect your MetaMask wallet to use the DApp.");
        }
      } catch (err) {
        setError("Failed to initialize DApp. " + err.message);
        setCurrentAccount(null);
        setContract(null);
        setMessages([]);
      }
    };

    init();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      } else {
        setCurrentAccount(null);
        setMessages([]);
        setContract(null);
        setError("Wallet disconnected.");
      }
    };

    const handleChainChanged = () => {
      setError("Network changed. Please reconnect.");
      setCurrentAccount(null);
      setContract(null);
      setMessages([]);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Set up contract-based event listener and fetch messages
  useEffect(() => {
    if (!contract) return;

    fetchAllMessages(contract);

    const listener = (sender, content, timestamp) => {
      setMessages(prev => [
        ...prev,
        { sender, content, timestamp: Number(timestamp) }
      ]);
    };

    contract.on("MessagePosted", listener);

    return () => {
      try {
        contract.off("MessagePosted", listener);
      } catch (err) {
        console.error("Error removing listener:", err);
      }
    };
  }, [contract, fetchAllMessages]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        setError("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
      setError('');
    } catch (err) {
      setError("Failed to connect wallet. " + err.message);
    }
  };

  const postMessage = async () => {
    if (!contract) {
      setError("Contract not loaded.");
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
      await tx.wait();
      setMessageContent('');
      // No need to manually update messages due to event listener
    } catch (err) {
      setError("Failed to post message. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 text-white flex flex-col items-center py-10 font-inter">
      <div className="bg-gray-800 bg-opacity-70 p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-purple-600">
        <h1 className="text-4xl font-bold text-center mb-6 text-purple-300">
          Decentralized Message Board
        </h1>

        {error && (
          <div className="bg-red-500 bg-opacity-80 text-white p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {!currentAccount ? (
          <div className="text-center">
            <p className="mb-4 text-lg">Connect your wallet to post and view messages.</p>
            <button
              onClick={connectWallet}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <p className="text-center text-lg mb-6">
              Connected: <span className="font-mono text-purple-400">{currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}</span>
            </p>

            <div className="mb-8 p-6 bg-gray-700 bg-opacity-60 rounded-lg shadow-inner border border-gray-600">
              <h2 className="text-2xl font-semibold mb-4 text-purple-200">Post a New Message</h2>
              <textarea
                className="w-full p-3 mb-4 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows="3"
                placeholder="What's on your mind?"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                disabled={loading}
              ></textarea>
              <button
                onClick={postMessage}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !messageContent.trim()}
              >
                {loading ? 'Posting...' : 'Post Message'}
              </button>
            </div>

            <div className="p-6 bg-gray-700 bg-opacity-60 rounded-lg shadow-inner border border-gray-600">
              <h2 className="text-2xl font-semibold mb-4 text-purple-200">All Messages</h2>
              {loading && messages.length === 0 && (
                <p className="text-center text-purple-400">Loading messages...</p>
              )}
              {messages.length === 0 && !loading && (
                <p className="text-center text-gray-400">No messages yet. Be the first to post!</p>
              )}
              <div className="space-y-4">
                {messages.slice().reverse().map((msg, index) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
                    <p className="text-gray-300 text-sm mb-1">
                      From: <span className="font-mono text-purple-400">{msg.sender.slice(0, 6)}...{msg.sender.slice(-4)}</span>
                    </p>
                    <p className="text-lg text-white mb-2 break-words">{msg.content}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(msg.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

