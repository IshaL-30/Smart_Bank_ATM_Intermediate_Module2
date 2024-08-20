import {useState, useEffect} from "react";
import {ethers} from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";
import { IoIosLogOut } from "react-icons/io";
import { IoMdRefresh } from "react-icons/io";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [transHistory, setTransHistory] = useState([]);
  const [autoWithdrawals, setAutoWithdrawals] = useState([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [totalGas, setTotalGas] = useState(0);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState("");

  const contractAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";
  const atmABI = atm_abi.abi;

  const getWallet = async() => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({method: "eth_accounts"});
      handleAccount(account);
    }
  }

  const handleAccount = (account) => {
    if (account) {
      console.log ("Account connected: ", account);
      setAccount(account);
    }
    else {
      console.log("No account found");
    }
  }

  const connectAccount = async() => {
    if (!ethWallet) {
      alert('MetaMask wallet is required to connect');
      return;
    }
  
    const accounts = await ethWallet.request({ method: 'eth_requestAccounts' });
    handleAccount(accounts);
    
    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);
 
    setATM(atmContract);
  }

  const getBalance = async() => {
    if (atm) {
      const ethBalance = ethers.utils.formatEther(await atm.getBalance())
      // const ethBalance = await atm.getBalance();
      setBalance(ethBalance);
    }
  }

  const deposit = async() => {
    if (atm && depositAmount) {
      let value = depositAmount.toString();
      let tx = await atm.deposit(ethers.utils.parseEther(value));
      let receipt = await tx.wait();
      let used_gas = receipt.gasUsed.toNumber();
      setTotalGas(total_gas => total_gas + used_gas);
      setDepositAmount("");
      getBalance();
      transactionHistory();
    }
  }

  const withdraw = async() => {
    if (atm && withdrawAmount) {
      let value = withdrawAmount.toString();
      let tx = await atm.withdraw(ethers.utils.parseEther(value));
      let receipt = await tx.wait();
      let used_gas = receipt.gasUsed.toNumber(); 

      setTotalGas(total_gas => total_gas + used_gas);
      setWithdrawAmount("");
      getBalance();
      transactionHistory();
    }
  };

  const getAutoWithdraws = async () => {
    if (atm) {
      const withdrawals = await atm.getAutoWithdraws();

      setAutoWithdrawals(withdrawals.map((w) => ({
        recipient: w.recipient,
        amount: ethers.utils.formatEther(w.amount),
        interval: w.interval.toNumber(),
        lastPaymentTime: new Date(w.lastPaymentTime.toNumber() * 1000).toLocaleString(),
      })));
    }
  };

  const setAutoWithdraw = async () => {
    if (atm) {
      let tx = await atm.setAutoWithdraw(recipient, ethers.utils.parseEther(amount), interval);
      await tx.wait();
      getAutoWithdraws();
      setRecipient("");
      setAmount("");
      setInterval("");
    }
  };

  const executeAutoWithdraws = async () => {
    if (atm) {
      let tx = await atm.executeAutoWithdraws({gasLimit: 10000000});
      let receipt = await tx.wait();
      let used_gas = receipt.gasUsed.toNumber(); 
      setTotalGas(total_gas => total_gas + used_gas);
      getBalance();
      transactionHistory();
      getAutoWithdraws();
    }
  };

  const deleteAutoWithdraw = async (index) => {
    if (atm) {
      let tx = await atm.deleteAutoWithdraw(index);
      await tx.wait();
      getAutoWithdraws(); // Clear the state
    }
  };

  const transactionHistory = async () => {
    if (atm) {
      const history = await atm.transactionHistory();
      setTransHistory(history.map((tx) => ({
        amount: ethers.utils.formatEther(tx.amount),
        usedGas: ethers.utils.formatUnits(tx.usedGas, 'gwei'),
        action: tx.action,
        timestamp: new Date(tx.timestamp.toNumber() * 1000).toLocaleString(),
      })));
    }
  };

  const clearTransactionHistory = async () => {
    if (atm) {
      let tx = await atm.clearTransactionHistory();
      await tx.wait();
      setTransHistory([]); // Clear the state
    }
  };

  const logout = async () => {
    setAccount(undefined);
    setATM(undefined);
    setDepositAmount('');
    setWithdrawAmount('');
    setBalance(undefined);
    setTotalGas(0);
    setTransHistory([]);
  };

  const initUser = () => {
    // Check to see if user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return <button onClick={connectAccount}>Please connect your Metamask wallet</button>
    }

    if (balance == undefined) {
      getBalance();
      transactionHistory();
      getAutoWithdraws();
    }

    return (
      <div style={styles.account_functions}>
        <div style={styles.para}>
          <p>Your Account: {account}</p>
          <p>Your Balance: {balance} ETH</p>
          {/* {<p>Gas Used: {usedGas}</p>} */}
          <div style={styles.totalgas}>
            <p>Total gas Used: {totalGas}</p>
          </div>
        </div>
        <div style={styles.column}>
          <div style={styles.column1}>
            <div style={styles.recur_payment}>
              <p>Set Auto Withdraw</p>
              <input
                type="text"
                placeholder="Payee Address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={styles.input_r}
              />
              <input
                type="number"
                placeholder="Amount(ETH)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.input_r}
              />
              <input
                type="number"
                placeholder="Interval(sec)"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                style={styles.input_r}
              />
              <button onClick={setAutoWithdraw} style={styles.button}>
                Set Automated Payment
              </button>
              <div>
                <p>
                  Automated Payments
                  <button onClick={executeAutoWithdraws}>
                    <IoMdRefresh />
                  </button>
                </p>
                {autoWithdrawals.length > 0 ? (
                  <ul style={styles.ul}>
                    {autoWithdrawals.map((w, index) => (
                      <li key={index}>
                        Payee: {w.recipient}, Amount: {w.amount} ETH, 
                        Interval: {w.interval} sec, Next Payment: {w.lastPaymentTime}  
                        <button
                          onClick={() => deleteAutoWithdraw(index)}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <h5>No Automated payments set.</h5>
                )}
              </div>
            </div>
          </div>
          <div style={styles.column2}>
            <div style={styles.his}>
              <p style={styles.trans}>Transaction History:</p>
              {/* <button onClick={getTransactionHistory}>Get Transaction History</button> */}
              <div style={styles.table_data}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                      <th>Transaction Type</th>
                      <th>Amount</th>
                      <th>Gas Used</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody style={styles.tbody}>
                    {/* {transactions.length > 0 && ( */}
                    {transHistory.map((tx, index) => (
                      <tr key={index}>
                        <td>{tx.action}</td>
                        <td>{tx.amount} ETH</td>
                        <td>{tx.usedGas}</td>
                        <td>{tx.timestamp}</td>
                      </tr>
                    ))}
                    {/* )} */}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div style={styles.items}>
          <div style={styles.btn_text}>
            <input
              type="number"
              value={depositAmount}
              placeholder="0"
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              style={styles.input}
            />{" "}
            <button onClick={deposit} style={styles.bt}>
              Deposit
            </button>
          </div>
          <div style={styles.btn_text}>
            <input
              type="number"
              value={withdrawAmount}
              placeholder="0"
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
              style={styles.input}
            />
            <button onClick={withdraw} style={styles.bt}>
              Withdraw
            </button>
          </div>
          <button onClick={clearTransactionHistory} style={styles.btn}>
            Clear History
          </button>
          <button onClick={logout} style={styles.btn}>
            Logout{" "}
            <span style={styles.icon}>
              <IoIosLogOut />
            </span>
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => { getWallet(); }, []);

  const styles = {
    container: {
      backgroundColor: "#19005f",
      color: "rgb(255, 255, 255)",
      textAlign: "center",
      alignItems: "center",
      justifyContent: "center",
      padding: "1%",
      margin: "auto",
      borderRadius: "10px",
      width: "95%",
      height: "95%",
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    },
    header: {
      margin: "40px 10px",
      fontSize: "28px",
      textDecoration: "double",
    },

    table_data: {
      textAlign: "center",
      alignItems: "center",
      justifyContent: "center",
      display: "flex",
      marginRight: "6%",
    },
    table: {
      width: "100%",
      alignItems: "Left",
      border: "1px solid black",
    },
    tbody: {
      fontSize: "16px",
      fontWeight: "16px",
      color: "rgb(151 0 121)",
    },
    ul: {
      fontSize: "16px",
      fontWeight: "16px",
      color: "rgb(151 0 121)",
    },
    thead: {
      color: "rgb(0 32 131)",
      fontWeight: "bold",
      fontSize: "20px",
    },
    init: {
      border: "2px solid black",
      borderRadius: "10px",
      margin: "2% 5%",
      height: "75%",
      backgroundColor: "rgb(255, 255, 255)",
      color: "#19005f",
      fontWeight: "bold",
      fontSize: "20px",
      padding: "2%",
    },
    account_functions: {
      height: "100%",
      textAlign: "left",
    },
    column: {
      display: "flex",
    },
    column1: {
      float: "left",
      width: "50%",
    },
    column2: {
      float: "right",
      width: "50%",
    },
    para: {
      fontSize: "18px",
      marginLeft: "4%",
      // textAlign: "center",
    },

    items: {
      position: "absolute",
      margin: "0% 4%",
      padding: "3px",
      fontSize: "30px",
      textAlign: "center",
      justifyContent: "center",
      bottom: "5%",
      width: "76%",
    },

    btn: {
      width: "150px",
      height: "40px",
      backgroundColor: "#120097",
      color: "rgb(252, 255, 239)",
      borderRadius: "5px",
      cursor: "pointer",
      alignItems: "center",
      textAlign: "center",
      justifyContent: "center",
      border: "none",
      margin: "0 1%",
      fontSize: "16px",
    },
    btn_text: {
      width: "150px",
      height: "40px",
      backgroundColor: "#120097",
      color: "rgb(252, 255, 239)",
      borderRadius: "5px",
      alignItems: "center",
      textAlign: "center",
      justifyContent: "center",
      border: "none",
      margin: "1% 1%",
      fontSize: "16px",
      display: "inline-flex",
    },
    his: {
      fontSize: "20px",
      height: "50%",
      marginLeft: "4%",
      padding: "0",
    },
    bt: {
      width: "40px",
      height: "15px",
      backgroundColor: "#120097",
      color: "rgb(252, 255, 239)",
      borderRadius: "5px",
      cursor: "pointer",
      border: "none",
      fontSize: "16px",
      margin: "0 9px",
      display: "inline-flex",
      alignItems: "center",
      textAlign: "center",
      justifyContent: "center",
    },
    input: {
      width: "30px",
      height: "18px",
      marginRight: "10px",
      borderRadius: "5px",
      border: "1px solid #120097",
      // padding: "5px",
      display: "inline-flex",
      alignItems: "center",
      textAlign: "center",
      justifyContent: "center",
    },
    input_r: {
      width: "80px",
      height: "18px",
      marginRight: "10px",
      borderRadius: "5px",
      border: "1px solid #120097",
      // padding: "5px",
      display: "inline-flex",
      alignItems: "center",
      textAlign: "center",
      justifyContent: "center",
    },
    button: {
      width: "180px",
      height: "20px",
      backgroundColor: "#120097",
      color: "rgb(252, 255, 239)",
      borderRadius: "5px",
      alignItems: "center",
      textAlign: "center",
      justifyContent: "center",
      border: "none",
      // margin: "1% 1%",
      fontSize: "14px",
      display: "inline-flex",
    },
    recur_payment: {
      marginLeft: "4%",
    },
  };

  return (
    <main>
      <div style={styles.container}>
        <header>
          <h1>Welcome to the Smart Bank ATM!</h1>
        </header>
        <div style={styles.init}>{initUser()}</div>
      </div>
    </main>
  );
}