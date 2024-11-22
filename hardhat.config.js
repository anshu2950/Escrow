/** @type import('hardhat/config').HardhatUserConfig */
require("dotenv").config({ path: ".env" });

require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers");


module.exports = {
  solidity: "0.8.27",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [
        `0x${process.env.PRIVATE_KEY}`, 
        `0x${process.env.SECOND_PRIVATE_KEY}`
      ],
    },
  },
};

