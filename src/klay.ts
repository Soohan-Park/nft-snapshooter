import Caver from "caver-js";
import { exit } from "process";
import abiConfig from "config/abiConfig";
import networkConfig from "config/networkConfig";
import interfaceId from "src/common/interfaceId";

const caver = new Caver(networkConfig.klay.providerUrl);

async function klay(contractAddress: string) {
  console.log(`--- FETCH ${contractAddress} ---`);
  const klayContract = new caver.contract(abiConfig.abi, contractAddress);

  // Check supports ERC721Enumerable
  const isSupported = await klayContract.methods
    .supportsInterface(interfaceId.ERC721Enumerable)
    .call();
  console.log(`isSupported? ${isSupported}`);
  if (!isSupported) {
    console.log(
      `@@@ ERROR: ${contractAddress} is not implemented ERC721Enumerable.`
    );
    exit(1);
  }

  const totalSupply: number = await klayContract.methods.totalSupply().call();
  console.log(`totalSupply: ${totalSupply}`);
  console.log(`Fetching...`);

  let owners: any = {};
  let bunchCount: number = 1;
  let bunchEachCount: number = totalSupply;

  for (let idx = 10; idx > 1; idx--) {
    if (totalSupply % idx === 0) {
      bunchCount = idx;
      bunchEachCount = totalSupply / idx;
      break;
    }
  }
  console.log(
    `totalSupply: ${totalSupply} | bunchCount: ${bunchCount} | bunchEachCount: ${bunchEachCount}`
  );

  for (let idx = 0; idx < bunchCount; idx++) {
    console.log(
      `[Fetch] Start: ${idx * bunchEachCount} | End: ${
        (idx + 1) * bunchEachCount - 1
      } `
    );

    owners = await _fetchOwnerOf(
      owners,
      klayContract,
      totalSupply,
      idx * bunchEachCount, // 0
      (idx + 1) * bunchEachCount - 1 // totalSupply - 1
    );
  }

  // const owners = {};
  // for (let idx = 0; idx < totalSupply; idx++) {
  //   const ownerAddress = await klayContract.methods.ownerOf(idx).call();
  //   if (!(ownerAddress in owners)) {
  //     owners[ownerAddress] = 0;
  //   }
  //   owners[ownerAddress] += 1;
  // }

  return owners;
}

async function _fetchOwnerOf(owners, ethContract_, totalSupply_, start_, end_) {
  return new Promise(async (resolve, reject) => {
    let counter = start_;

    for (let idx = start_; idx <= end_; idx++) {
      ethContract_.methods
        .ownerOf(idx)
        .call()
        .then((ownerAddress) => {
          if (!(ownerAddress in owners)) {
            owners[ownerAddress] = 0;
          }
          owners[ownerAddress] += 1;
          counter++;
        });
    }

    const interval = setInterval(() => {
      if (counter <= end_) {
        console.log(`Fetching... ${counter}/${end_} (${totalSupply_})`);
      } else {
        console.log(`Done! ${counter - 1}/${end_} (${totalSupply_})`);
        clearInterval(interval);
        resolve(owners);
      }
    }, 3000);
  });
}

export default klay;
