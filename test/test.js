const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Escrow Contract", function () {
    let escrow, manager, owner, addr1, addr2;
  
    beforeEach(async function () {
      [owner, addr1, addr2, manager] = await ethers.getSigners();
  
      const Escrow = await ethers.getContractFactory("Escrow");
      escrow = await Escrow.deploy(manager.address);
      await escrow.deployed();
    });
  
    it("Should deposit ETH and emit Deposited event", async function () {
      const depositAmount = ethers.utils.parseEther("1");
      const tx = await addr1.sendTransaction({
        to: escrow.address,
        value: depositAmount,
      });
  
      await tx.wait();
      const contractBalance = await ethers.provider.getBalance(escrow.address);
      expect(contractBalance).to.equal(depositAmount);
  
      await expect(tx)
        .to.emit(escrow, "Deposited")
        .withArgs(addr1.address, depositAmount);
    });
  
    it("Should whitelist a user", async function () {
      const allowance = ethers.utils.parseEther("10");
      await expect(escrow.connect(manager).whitelist(addr1.address, allowance))
        .to.emit(escrow, "Whitelisted")
        .withArgs(addr1.address, allowance);
  
      const [allowanceFromContract, withdrawn, isWhitelisted] = await escrow.getAllowance(addr1.address);
      expect(allowanceFromContract).to.equal(allowance);
      expect(withdrawn).to.equal(0);
      expect(isWhitelisted).to.equal(true);
    });
  
    it("Should revoke a user's whitelist status", async function () {
      const allowance = ethers.utils.parseEther("10");
      await escrow.connect(manager).whitelist(addr1.address, allowance);
  
      await expect(escrow.connect(manager).revoke(addr1.address))
        .to.emit(escrow, "Revoked")
        .withArgs(addr1.address);
  
      const [, , isWhitelisted] = await escrow.getAllowance(addr1.address);
      expect(isWhitelisted).to.equal(false);
    });
  
    it("Should allow a whitelisted user to withdraw funds", async function () {
      const depositAmount = ethers.utils.parseEther("1");
      await addr1.sendTransaction({
        to: escrow.address,
        value: depositAmount,
      });
      const allowance = ethers.utils.parseEther("1");
      await escrow.connect(manager).whitelist(addr1.address, allowance);
  
      const withdrawAmount = ethers.utils.parseEther("1");
      const tx = await escrow.connect(addr1).withdraw(withdrawAmount);
  
      await tx.wait();
  
      const contractBalance = await ethers.provider.getBalance(escrow.address);
      expect(contractBalance).to.equal(0);
  
      await expect(tx)
        .to.emit(escrow, "Withdrawn")
        .withArgs(addr1.address, withdrawAmount);
    });
  
    it("Should revert withdrawal for insufficient allowance", async function () {
      const depositAmount = ethers.utils.parseEther("1");
      await addr1.sendTransaction({
        to: escrow.address,
        value: depositAmount,
      });
  
      const allowance = ethers.utils.parseEther("0.5");
      await escrow.connect(manager).whitelist(addr1.address, allowance);
      await expect(
        escrow.connect(addr1).withdraw(ethers.utils.parseEther("1"))
      ).to.be.revertedWith("Insufficient allowance");
    });
  
    it("Should blacklist a user", async function () {
      const allowance = ethers.utils.parseEther("10");
      await escrow.connect(manager).whitelist(addr1.address, allowance);
      await expect(escrow.connect(manager).blacklist(addr1.address))
        .to.emit(escrow, "Blacklisted")
        .withArgs(addr1.address);
  
      const [, , isWhitelisted] = await escrow.getAllowance(addr1.address);
      expect(isWhitelisted).to.equal(false);
    });
  
    it("Should not allow a non-whitelisted user to withdraw", async function () {
      const depositAmount = ethers.utils.parseEther("1");
      await addr1.sendTransaction({
        to: escrow.address,
        value: depositAmount,
      });
      await expect(
        escrow.connect(addr2).withdraw(ethers.utils.parseEther("1"))
      ).to.be.revertedWith("You are not whitelisted");
    });
  });
  