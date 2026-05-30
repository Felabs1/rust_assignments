import { useState, useEffect } from "react";
import {
  isConnected,
  setAllowed,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";
import { Client } from "no_loss_auction";

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [status, setStatus] = useState<string>("Awaiting connection...");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [auctionData, setAuctionData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("Loading...");
  const [resetDuration, setResetDuration] = useState<string>("5");

  // --- AUTO-FETCH HOOK ---
  useEffect(() => {
    if (walletAddress) {
      fetchAuctionState();
    }
  }, [walletAddress]);

  // --- COUNTDOWN ENGINE ---
  useEffect(() => {
    if (!auctionData || !auctionData.deadline) return;

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const deadline = Number(auctionData.deadline);
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft("🚨 Auction Ended");
        clearInterval(timer);
      } else {
        const d = Math.floor(diff / (3600 * 24));
        const h = Math.floor((diff % (3600 * 24)) / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;

        if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
        else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
        else setTimeLeft(`${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auctionData]);

  const connectWallet = async () => {
    try {
      setStatus("Connecting to Freighter...");
      if (await isConnected()) {
        await setAllowed();
        const response = await getAddress();
        const actualAddress =
          typeof response === "string" ? response : response.address;
        setWalletAddress(actualAddress);
        setStatus("Wallet connected successfully!");
      } else {
        setStatus("Freighter wallet not detected.");
      }
    } catch (error) {
      console.error(error);
      setStatus("Connection failed.");
    }
  };

  const fetchAuctionState = async () => {
    if (!walletAddress) return;
    try {
      const contract = new Client({
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CCHWSSU5SXNTWAZKPMJRCRR6PCKFW5BIWKIXMBQXQY2YMOME4CVKWMF2",
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: walletAddress,
      });

      const tx = await contract.get_auction_data();
      setAuctionData(tx.result);
      setStatus("🟢 Live");
    } catch (error: any) {
      console.error(error);
      setStatus(`❌ Sync Error`);
    }
  };

  const placeBid = async () => {
    if (!walletAddress) return setStatus("Please connect your wallet first.");
    if (!bidAmount || isNaN(Number(bidAmount)) || Number(bidAmount) <= 0) {
      return setStatus("Please enter a valid bid amount.");
    }

    setIsLoading(true);
    setStatus("Check Freighter to sign transaction...");

    try {
      const contract = new Client({
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CCHWSSU5SXNTWAZKPMJRCRR6PCKFW5BIWKIXMBQXQY2YMOME4CVKWMF2",
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: walletAddress,
        signTransaction: signTransaction,
      });

      const tx = await contract.bid({
        bidder: walletAddress,
        amount: BigInt(bidAmount),
      });

      await tx.signAndSend();

      setStatus("🎉 Bid Confirmed!");
      setBidAmount("");
      fetchAuctionState();
    } catch (error: any) {
      console.error(error);
      setStatus(`Transaction Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeAuction = async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setStatus("Signing Finalize...");
    try {
      const contract = new Client({
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CCHWSSU5SXNTWAZKPMJRCRR6PCKFW5BIWKIXMBQXQY2YMOME4CVKWMF2",
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: walletAddress,
        signTransaction: signTransaction,
      });
      const tx = await contract.finalize();
      await tx.signAndSend();
      setStatus("✅ Auction Finalized!");
      fetchAuctionState();
    } catch (error: any) {
      setStatus(`❌ Finalize Failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAuction = async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setStatus("Signing Cancel...");
    try {
      const contract = new Client({
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CCHWSSU5SXNTWAZKPMJRCRR6PCKFW5BIWKIXMBQXQY2YMOME4CVKWMF2",
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: walletAddress,
        signTransaction: signTransaction,
      });
      const tx = await contract.cancel();
      await tx.signAndSend();
      setStatus("🚫 Auction Cancelled.");
      fetchAuctionState();
    } catch (error: any) {
      setStatus(`❌ Cancel Failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAuction = async () => {
    if (!walletAddress) return;

    // Validate the input
    const mins = Number(resetDuration);
    if (isNaN(mins) || mins <= 0) {
      setStatus("❌ Please enter a valid number of minutes.");
      return;
    }

    setIsLoading(true);
    setStatus("Signing Reset...");
    try {
      const contract = new Client({
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CCHWSSU5SXNTWAZKPMJRCRR6PCKFW5BIWKIXMBQXQY2YMOME4CVKWMF2",
        rpcUrl: "https://soroban-testnet.stellar.org",
        publicKey: walletAddress,
        signTransaction: signTransaction,
      });

      // Calculate the exact future timestamp based on admin input
      const currentUnixTime = Math.floor(Date.now() / 1000);
      const newDeadline = BigInt(currentUnixTime + mins * 60);

      const tx = await contract.reset_auction({ new_deadline: newDeadline });
      await tx.signAndSend();

      setStatus(`🔄 Auction Reset for ${mins} minutes!`);
      fetchAuctionState();
    } catch (error: any) {
      setStatus(`❌ Reset Failed`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* Header Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ margin: 0, color: "#38bdf8", letterSpacing: "-0.5px" }}>
            Auction Vault
          </h2>
          <div
            style={{
              fontSize: "12px",
              background: "#1e293b",
              padding: "6px 12px",
              borderRadius: "20px",
              color: status === "🟢 Live" ? "#10b981" : "#94a3b8",
            }}
          >
            {status}
          </div>
        </div>

        {!walletAddress ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#1e293b",
              borderRadius: "16px",
              border: "1px solid #334155",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0" }}>
              Connect your wallet to enter
            </h3>
            <button
              onClick={connectWallet}
              style={{
                padding: "14px 28px",
                background: "#38bdf8",
                color: "#0f172a",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
                width: "100%",
                transition: "0.2s",
              }}
            >
              Connect Freighter
            </button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Live Data Display Card */}
            <div
              style={{
                background: "linear-gradient(145deg, #1e293b, #0f172a)",
                padding: "30px 20px",
                borderRadius: "16px",
                border: "1px solid #334155",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  fontSize: "12px",
                  letterSpacing: "1px",
                }}
              >
                Current Highest Bid
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "48px",
                  color: "#fff",
                  textShadow: "0 0 20px rgba(56, 189, 248, 0.3)",
                }}
              >
                {auctionData ? auctionData.highest_bid.toString() : "---"}{" "}
                <span style={{ fontSize: "20px", color: "#38bdf8" }}>TKN</span>
              </h1>

              <div
                style={{
                  marginTop: "20px",
                  display: "inline-block",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  color: "#ef4444",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  fontFamily: "monospace",
                  fontSize: "18px",
                }}
              >
                ⏱ {timeLeft}
              </div>

              {auctionData && auctionData.highest_bidder && (
                <p
                  style={{
                    margin: "15px 0 0 0",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  Held by: {auctionData.highest_bidder.slice(0, 5)}...
                  {auctionData.highest_bidder.slice(-4)}
                </p>
              )}
            </div>

            {/* Action Card */}
            <div
              style={{
                background: "#1e293b",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid #334155",
              }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Amount..."
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "16px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={placeBid}
                  disabled={isLoading}
                  style={{
                    padding: "0 24px",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    cursor: isLoading ? "wait" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? "..." : "Bid"}
                </button>
              </div>
              <p
                style={{
                  margin: "15px 0 0 0",
                  fontSize: "12px",
                  color: "#64748b",
                  textAlign: "center",
                }}
              >
                Connected: {walletAddress.slice(0, 6)}...
                {walletAddress.slice(-4)}
              </p>
            </div>

            {/* Live Bid History Ledger */}
            {auctionData &&
              auctionData.bidders &&
              auctionData.bidders.length > 0 && (
                <div
                  style={{
                    background: "#1e293b",
                    padding: "20px",
                    borderRadius: "16px",
                    border: "1px solid #334155",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 15px 0",
                      color: "#94a3b8",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Participant Roster
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      maxHeight: "180px",
                      overflowY: "auto",
                      paddingRight: "5px",
                    }}
                  >
                    {auctionData.bidders.map(
                      (bidder: string, index: number) => {
                        const isWinner = bidder === auctionData.highest_bidder;
                        return (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: isWinner
                                ? "rgba(16, 185, 129, 0.1)"
                                : "#0f172a",
                              border: isWinner
                                ? "1px solid rgba(16, 185, 129, 0.3)"
                                : "1px solid transparent",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              fontSize: "13px",
                            }}
                          >
                            <span style={{ color: "#64748b" }}>
                              Bidder {index + 1}
                            </span>
                            <span
                              style={{
                                fontFamily: "monospace",
                                color: isWinner ? "#10b981" : "#cbd5e1",
                              }}
                            >
                              {bidder.slice(0, 6)}...{bidder.slice(-4)}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

            {/* Admin Controls */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.5)",
                padding: "15px",
                borderRadius: "12px",
                border: "1px dashed #334155",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "12px",
                  color: "#64748b",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                Admin Zone
              </p>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "stretch" }}
              >
                <button
                  onClick={finalizeAuction}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "transparent",
                    color: "#a855f7",
                    border: "1px solid #a855f7",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Finalize
                </button>

                <button
                  onClick={cancelAuction}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "transparent",
                    color: "#ef4444",
                    border: "1px solid #ef4444",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Cancel
                </button>

                {/* Embedded Reset Input & Button */}
                <div
                  style={{
                    display: "flex",
                    flex: 1.2,
                    border: "1px solid #f59e0b",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <input
                    type="number"
                    value={resetDuration}
                    onChange={(e) => setResetDuration(e.target.value)}
                    style={{
                      width: "45px",
                      background: "rgba(0,0,0,0.2)",
                      border: "none",
                      color: "#fff",
                      textAlign: "center",
                      outline: "none",
                      fontSize: "13px",
                    }}
                    title="Minutes"
                  />
                  <button
                    onClick={resetAuction}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      background: "transparent",
                      color: "#f59e0b",
                      border: "none",
                      borderLeft: "1px solid #f59e0b",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
