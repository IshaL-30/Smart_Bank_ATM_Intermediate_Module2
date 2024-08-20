# SmartBank ATM

SmartBank ATM is a decentralized application that allows users to interact with their Ethereum accounts, manage deposits and withdrawals, view transaction history, and set up automatic withdrawals. This application provides an easy-to-use interface for managing digital assets and viewing transaction details.

## Description

SmartBank ATM is designed to simulate a traditional ATM experience using Ethereum smart contracts. Users can connect their MetaMask wallet to view their account information, deposit or withdraw ETH, and track their transaction history. Additionally, users can set up automatic withdrawals and manage their recurring payments. This application leverages Ethereum's blockchain to ensure secure and transparent transactions.

## Getting Started

### Prerequisites

- **Node.js**: Ensure Node.js is installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).
- **MetaMask**: Install and configure MetaMask. You can get it from [metamask.io](https://metamask.io/).

### Installing

1. **Clone the repository:**

```git clone https://github.com/IshaL-30/Smart_Bank_ATM_Intermediate_Module2.git```

2. **Navigate to the project directory:**

```cd SmartBank-ATM```

3. **Install dependencies:**

```npm install```

### Running the Project

1. **Open a terminal and start the Hardhat local Ethereum node:**
```npx hardhat node```

2. **Open a second terminal and deploy the smart contract to the local network:**
```npx hardhat run --network localhost scripts/deploy.js```

3. **Open a third terminal and start the front-end development server:**
```npm run dev```

4. **Visit the application in your browser:**
```Open http://localhost:3000 to interact with the SmartBank ATM.```

**Connect your MetaMask wallet to the application.**

## Features
- View account balance
- Deposit and withdraw ETH
- View transaction history
- Set up and manage automatic withdrawals
- Clear transaction history
- Log out

## Help
If you encounter any issues or need assistance, make sure:
- MetaMask is properly installed and configured.
- Your Ethereum wallet has sufficient funds for transactions and gas fees.
- You are connected to the correct network.

For further help, refer to MetaMask's [official documentation](https://metamask.io/learn/).