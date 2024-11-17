import { ethers } from "hardhat";

async function main() {
    // Deploy UniswapTrader
    const UniswapTrader = await ethers.getContractFactory("UniswapTrader");
    const trader = await UniswapTrader.deploy(
        "UNISWAP_ROUTER_ADDRESS",
        "UNISWAP_QUOTER_ADDRESS",
        "WETH_ADDRESS"
    );
    await trader.deployed();

    // Deploy OrderManager
    const OrderManager = await ethers.getContractFactory("OrderManager");
    const orderManager = await OrderManager.deploy(trader.address);
    await orderManager.deployed();

    console.log("UniswapTrader deployed to:", trader.address);
    console.log("OrderManager deployed to:", orderManager.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
