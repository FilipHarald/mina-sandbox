import Head from "next/head";
import {AccountUpdate, PrivateKey} from "o1js";
import { useEffect } from "react";

const PROOFS_ENABLED = false;

export default function Home() {
  useEffect(() => {
    (async () => {
      const { Mina } = await import("o1js");
      const { Add } = await import("../../../contracts/build/src/");

      const Local = Mina.LocalBlockchain({
        proofsEnabled: PROOFS_ENABLED,
      });
      Mina.setActiveInstance(Local);
      const { privateKey: deployerKey, publicKey: deployerAccount } =
        Local.testAccounts[0];
      const { privateKey: senderKey, publicKey: senderAccount } =
        Local.testAccounts[1];

      const zkAppKey = PrivateKey.random();
      const zkAppAccount = zkAppKey.toPublicKey();

      const zkAppInstance = new Add(zkAppAccount);
      console.log("deploying...", zkAppInstance.address.toBase58().toString());
      const deployTxn = await Mina.transaction(deployerAccount, () => {
        AccountUpdate.fundNewAccount(deployerAccount);
        zkAppInstance.deploy();
      });

      await deployTxn.sign([deployerKey, zkAppKey]).send();

      const num0 = zkAppInstance.num.get();
      console.log("num0", num0.toString());

    })();
  }, []);

  return (
    <>
      <Head>
        <title>Mina Sandbox</title>
        <meta name="description" content="testing mina out..." />
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
    </>
  );
}
