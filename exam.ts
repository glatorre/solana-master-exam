import {Keypair, Connection, LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js"
import fs from "fs"

import {createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer} from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com", "finalized");

async function generateAndAirdrop(){

    let keypair = Keypair.generate();
    console.log(`Hai generato il tuo nuovo wallet: ${keypair.publicKey.toBase58()} \n\n Per salvare il tuo wallet, copia e incolla il seguente JSON in un file: [${keypair.secretKey}]`)
    fs.writeFileSync('./wallet.json', `[${keypair.secretKey}]`, "utf-8")
    try {
        const airdropSignature = await connection.requestAirdrop(
            keypair.publicKey,      // Indirizzo del wallet a cui inviare i fondi
            2 * LAMPORTS_PER_SOL    // Quantità di SOL richiesta (1 SOL = 1_000_000_000 LAMPORTS)
        );
        console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${airdropSignature}?cluster=devnet`);
    } catch (error) {
        console.error("Airdrop error");
        return;
    }
}

async function mint(){
    const wallet = require("./wallet.json");
    const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

    let mint;
    let ata;

    try{
        mint = await createMint(
            connection,
            keypair,
            keypair.publicKey,
            null,
            6,
        );

        console.log("Mint Address:", mint.toBase58());
    }
    catch(err){
        console.log(err)
        console.log("SPL init error")
        return;
    }

    // mint
    try{
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            keypair.publicKey
        );

        ata = tokenAccount.address;
        console.log("Associated Token Account: ", ata.toBase58());

        const amount = 20e6;

        await mintTo(
            connection,
            keypair,
            mint,
            ata,
            keypair.publicKey,
            amount
        );

        console.log("Minted", amount, "to", ata.toBase58());
    }
    catch(err){
        console.log("Mint error")
        return;
    }

    // transfer
    try{
        const to = Keypair.generate();
        console.log("To: ", to.publicKey.toBase58());

        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            to.publicKey,
        );

        const toAta = tokenAccount.address;
        console.log("Associated Token Account: ", toAta.toBase58());

        const amountToAta = tokenAccount.amount;
        console.log("Amount in ATA: ", amountToAta.toString());

        const amount = 3e5;

        await transfer(
            connection,
            keypair,
            ata,
            toAta,
            keypair,
            amount
        );

        console.log("Transferred", amount, "from", ata.toBase58(), "to", toAta.toBase58());
    }
    catch(err){
        console.log("transfer error")
    }
}

async function exam(){
    if(!fs.existsSync("./wallet.json")) {
        await generateAndAirdrop()
    }
    await mint()
}

exam()