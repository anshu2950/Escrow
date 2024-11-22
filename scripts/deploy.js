const hre = require("hardhat");

async function main() {
    const Escrow = await hre.ethers.getContractFactory("Escrow");
    const deployer = (await hre.ethers.getSigners())[0];
    const managerAddress = "0x0fD877BdE88E84EAfE882d20315114ddfe2f3459"; 


    console.log("Deploying contract with the deployer address:", deployer.address);
    
    const escrow = await Escrow.deploy(managerAddress);

    await escrow.deployed();

    console.log("Escrow contract deployed to:", escrow.address);
    console.log("Manager address:", manager.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
