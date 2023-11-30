// TODO: this component will return public keys and can  sign transactions

import ZkappWorkerClient from "@/utils/zkappWorkerClient";
import { PrivateKey, PublicKey } from "o1js";
import { useState } from "react";

type Account = {
  publicKey: PublicKey;
  privateKey: PrivateKey;
};

type TestAccounts = null | Account[];

type Args = {
  isLocalBlockChain: boolean;
  zkappWorkerClient: typeof ZkappWorkerClient;
};

export const useMinaSigner = ({ isLocalBlockChain, zkappWorkerClient }: Args) => {
  const [state, setState] = useState({
    signerAccount: null as null | Account,
  });

  useEffect(() => {
    async function timeout(seconds: number): Promise<void> {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, seconds * 1000);
      });
    }

    (async () => {
        if (isLocalBlockChain) {
          // TODO
        } else {
          const mina = (window as any).mina;
          if (mina !== null) {
            setState({
              ...state,
              hasWallet: true,
            });
          }
        }
        console.log("Loading web worker...");
        const zkappWorkerClient = new ZkappWorkerClient();
        await timeout(5);

        console.log("Done loading web worker ✅");

        await zkappWorkerClient.setActiveInstanceToBerkeley();

        const mina = (window as any).mina;

        if (mina == null) {
          setState({ ...state, hasWallet: false });
          return;
        }

        const publicKeyBase58: string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);
        // NOTE: This is the wallet key

        console.log(`Using key:${publicKey.toBase58()}`);

        console.log("Checking if fee payer account exists...");

        const res = await zkappWorkerClient.fetchAccount({
          publicKey: publicKey!,
        });
        const accountExists = res.error == null;

        await zkappWorkerClient.loadContract();

        console.log("Compiling zkApp...");
        await zkappWorkerClient.compileContract();
        console.log("zkApp compiled");
        //const testAccounts = await zkappWorkerClient.getTestAccounts();

        // if (!testAccounts) {
        //   throw new Error("Test accounts not found");
        // }
        //    const { privateKey: deployerKey, publicKey: deployerAccount } =
        //      testAccounts?.[0];

        //    const zkAppPrivateKey = PrivateKey.random();
        //    const zkAppAddress = zkAppPrivateKey.toPublicKey();

        //   // const zkAppInstance = new Square(zkAppAddress);
        //   // const deployTxn = await Mina.transaction(deployerAccount, () => {
        //   //   AccountUpdate.fundNewAccount(deployerAccount);
        //   //   zkAppInstance.deploy();
        //   // });

        //   // await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

        const zkappPublicKey = PublicKey.fromBase58(ZKAPP_ADDRESS);

        await zkappWorkerClient.initZkappInstance(zkappPublicKey);

        console.log("Getting zkApp state...");
        await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
        const currentNum = await zkappWorkerClient.getNum();
        console.log(`Current state in zkApp: ${currentNum.toString()}`);

        setState({
          ...state,
          zkappWorkerClient,
          hasWallet: true,
          hasBeenSetup: true,
          publicKey,
          zkappPublicKey,
          accountExists,
          currentNum,
        });
    })();
  }, [isLocalBlockChain]);

  return {
    ...state,
  };
};
