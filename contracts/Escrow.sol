// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

contract Escrow {
    address public manager;
    address public owner; 
    uint public mapSize;

    struct Beneficiary {
        uint allowance;
        uint withdrawn;
        bool whitelisted;
    }
    struct Txn {
        address user;
        uint amount;
        string action;
    }

    Txn[] public txns;

    mapping(address => Beneficiary) public beneficiaries;

    event Whitelisted(address indexed user, uint allowance);
    event Revoked(address indexed user);
    event Deposited(address indexed from, uint amount);
    event Withdrawn(address indexed user, uint amount);
    event Blacklisted(address indexed user);

    constructor(address _manager) {
        manager = _manager;
        owner = msg.sender;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Only the manager can perform this action");
        _;
    }

    modifier onlyWhitelisted() {
        require(beneficiaries[msg.sender].whitelisted, "You are not whitelisted");
        _;
    }
    receive() external payable {
        txns.push(Txn({
            user: msg.sender,
            amount: msg.value,
            action: "deposit"
        }));
        emit Deposited(msg.sender, msg.value);
    }

    function whitelist(address _user, uint _allowed) public onlyManager returns (bool) {
        Beneficiary storage user = beneficiaries[_user];
        user.allowance = _allowed;
        user.whitelisted = true;
        mapSize++;
        emit Whitelisted(_user, _allowed);
        return true;
    }

    function revoke(address _user) public onlyManager {
        require(beneficiaries[_user].whitelisted, "User is not whitelisted");
        beneficiaries[_user].whitelisted = false;
        mapSize--;
        emit Revoked(_user);
    }

    function withdraw(uint _amount) public onlyWhitelisted {
        Beneficiary storage user = beneficiaries[msg.sender];
        require(user.allowance >= user.withdrawn + _amount, "Insufficient allowance");
        require(address(this).balance >= _amount, "Insufficient contract balance");

        user.withdrawn += _amount;
        payable(msg.sender).transfer(_amount);

        txns.push(Txn({
            user: msg.sender,
            amount: _amount,
            action: "withdraw"
        }));

        emit Withdrawn(msg.sender, _amount);
    }

    function blacklist(address _user) public onlyManager {
        require(beneficiaries[_user].whitelisted, "User is not whitelisted");
        beneficiaries[_user].whitelisted = false;
        beneficiaries[_user].allowance = 0;
        emit Blacklisted(_user);
    }

    function getAllowance(address _user) public view returns (uint, uint, bool) {
        Beneficiary storage user = beneficiaries[_user];
        return (user.allowance, user.withdrawn, user.whitelisted);
    }

    function getTransactions() public view returns (Txn[] memory) {
        return txns;
    }
}
