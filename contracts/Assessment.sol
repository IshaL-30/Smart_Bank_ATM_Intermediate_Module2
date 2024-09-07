// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

//import "hardhat/console.sol";

contract Assessment {
    address payable public owner;
    uint256 public balance;
    uint256 public withdrawLimit;

    // Structure to store transaction details
    struct Transaction {
        uint256 amount;
        uint256 usedGas;
        string action;
        uint256 timestamp;
    }

    struct AutoWithdraw {
        address payable recipient;
        uint256 amount;
        uint256 interval; // in seconds
        uint256 lastPaymentTime;
    }

    Transaction[] public transactions;
    // AutoWithdraw[] public autoWithdraws;

    mapping(address => AutoWithdraw[]) public autoWithdraws;

    event Deposit(uint256 amount, uint256 usedGas);
    event Withdraw(uint256 amount, uint256 usedGas);
    event AutoWithdrawExecuted(address recipient, uint256 amount, uint256 usedGas);
    event AutoWithdrawDeleted(uint index);
    event TransactionHistoryCleared();

    constructor(uint initBalance) payable {
        owner = payable(msg.sender);
        balance = initBalance;
    }

    function getBalance() public view returns(uint256){
        return balance;
    }

    function deposit(uint256 _amount) public payable {
        uint256 initialGas = gasleft();
        uint _previousBalance = balance;

        // make sure this is the owner
        require(msg.sender == owner, "You are not the owner of this account");

        // perform transaction
        balance += _amount;

        // calculate gas used
        uint256 gasUsed = initialGas - gasleft();  // Gas remaining after transaction
        uint256 _usedGas = gasUsed * tx.gasprice;  // Calculate gas used
        // uint _usedGas = tx.gasprice * gasleft();

        // Record the transactions
        transactions.push(Transaction({
            amount: _amount,
            usedGas: _usedGas,
            action: "Deposit",
            timestamp: block.timestamp
        }));

        // assert transaction completed successfully
        assert(balance == _previousBalance + _amount);

        // emit the event
        emit Deposit(_amount, _usedGas);
    }

    // custom error
    error InsufficientBalance(uint256 balance, uint256 withdrawAmount);

    function withdraw(uint256 _withdrawAmount) public {
        require(msg.sender == owner, "You are not the owner of this account");
        require(_withdrawAmount <= withdrawLimit, "Withdrawal amount exceeds the limit");
        uint256 initialGas = gasleft();
        uint _previousBalance = balance;
        if (balance < _withdrawAmount) {
            revert InsufficientBalance({
                balance: balance,
                withdrawAmount: _withdrawAmount
            });
        }

        // withdraw the given amount
        balance -= _withdrawAmount;

        // calculate gas used
        uint256 gasUsed = initialGas - gasleft();  // Gas remaining after transaction
        uint256 _usedGas = gasUsed * tx.gasprice;  // Calculate gas used
        // uint _usedGas = tx.gasprice * gasleft();

        // Record the transaction in history
        transactions.push(Transaction({
            amount: _withdrawAmount,
            usedGas: _usedGas,
            action: "Withdraw",
            timestamp: block.timestamp
        }));

        // assert the balance is correct
        assert(balance == (_previousBalance - _withdrawAmount));

        // emit the event
        emit Withdraw(_withdrawAmount, _usedGas);
    }

    function setWithdrawLimit(uint256 _limit) public {
        require(msg.sender == owner, "You are not the owner of this account");
        withdrawLimit = _limit;
    }

    // Function to set up multiple auto-withdrawals
    function setAutoWithdraw(address payable _recipient, uint256 _amount, uint256 _interval) public {
        require(msg.sender == owner, "You are not the owner of this account");
        require(_interval > 0, "Interval must be greater than 0");
        require(_amount > 0, "Amount must be greater than 0");

        autoWithdraws[msg.sender].push(AutoWithdraw({
            recipient: _recipient,
            amount: _amount,
            interval: _interval,
            lastPaymentTime: block.timestamp
        }));
    }

    // Function to process all auto-withdrawals
    function executeAutoWithdraws() public {
        require(msg.sender == owner, "You are not the owner of this account");

        AutoWithdraw[] storage userWithdraws = autoWithdraws[owner];

        for (uint i = 0; i < userWithdraws.length; i++) {
            if (block.timestamp >= (userWithdraws[i].lastPaymentTime + userWithdraws[i].interval)) 
            {
                uint256 withdrawAmount = userWithdraws[i].amount;
                if (balance >= withdrawAmount) 
                {
                    balance -= withdrawAmount;
                    userWithdraws[i].recipient.transfer(withdrawAmount);

                    uint _usedGas = tx.gasprice * gasleft();

                    transactions.push(Transaction({
                        amount: withdrawAmount,
                        usedGas: _usedGas,
                        action: "AutoWithdraw",
                        timestamp: block.timestamp
                    }));

                    userWithdraws[i].lastPaymentTime = block.timestamp;

                    emit AutoWithdrawExecuted(userWithdraws[i].recipient, withdrawAmount, _usedGas);
                } 
                else {
                    revert InsufficientBalance({
                        balance: balance,
                        withdrawAmount: withdrawAmount
                    });
                }
            }
        }
    }

    // Function to delete a specific auto-withdrawal
    function deleteAutoWithdraw(uint index) public {
        require(msg.sender == owner, "You are not the owner of this account");
        require(index < autoWithdraws[owner].length, "Index out of bounds");

        for (uint i = index; i < autoWithdraws[owner].length - 1; i++) {
            autoWithdraws[owner][i] = autoWithdraws[owner][i + 1];
        }
        autoWithdraws[owner].pop();

        emit AutoWithdrawDeleted(index);
    }

    // Function to clear transaction history
    function clearTransactionHistory() public {
        require(msg.sender == owner, "You are not the owner of this account");
        delete transactions;
        emit TransactionHistoryCleared();
    }

    // Function to get transaction history
    function transactionHistory() public view returns (Transaction[] memory) {
        return transactions;
    }

    // Function to get all auto-withdrawals
    function getAutoWithdraws() public view returns (AutoWithdraw[] memory) {
        return autoWithdraws[owner];
    }
}
