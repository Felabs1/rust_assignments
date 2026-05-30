import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
if (typeof window !== "undefined") {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CDJYLH2WRGU73HV7GHOUUWL4ZFIBUQA3UHIPSYWYM73VEMB5RWUQUPPH",
    }
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin, token, deadline }, 
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy({ admin, token, deadline }, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAAAAAAADYmlkAAAAAAIAAAAAAAAABmJpZGRlcgAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
            "AAAAAAAAADZDYW5jZWxzIHRoZSBhdWN0aW9uIE9OTFkgaWYgbm8gYmlkcyBleGlzdCAoQWRtaW4gT25seSkAAAAAAAZjYW5jZWwAAAAAAAAAAAAA",
            "AAAAAAAAADlGaW5hbGl6ZXMgdGhlIGF1Y3Rpb24gYWZ0ZXIgdGhlIGRlYWRsaW5lIChQZXJtaXNzaW9ubGVzcykAAAAAAAAIZmluYWxpemUAAAAAAAAAAA==",
            "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAAT",
            "AAAAAAAAAAAAAAAJZ2V0X3Rva2VuAAAAAAAAAAAAAAEAAAAT",
            "AAAAAAAAAAAAAAALZ2V0X2JpZGRlcnMAAAAAAAAAAAEAAAPqAAAAEw==",
            "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAMAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAhkZWFkbGluZQAAAAYAAAAA",
            "AAAAAAAAADlSZXNldHMgdGhlIGNvbnRyYWN0IGZvciBhIGJyYW5kIG5ldyBhdWN0aW9uLiAoQWRtaW4gT25seSkAAAAAAAANcmVzZXRfYXVjdGlvbgAAAAAAAAEAAAAAAAAADG5ld19kZWFkbGluZQAAAAYAAAAA",
            "AAAAAAAAAAAAAAAQZ2V0X2F1Y3Rpb25fZGF0YQAAAAAAAAABAAAH0AAAAAtBdWN0aW9uRGF0YQA=",
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAFVG9rZW4AAAAAAAAAAAAAAAAAAAtBdWN0aW9uRGF0YQA=",
            "AAAAAQAAAAAAAAAAAAAAC0F1Y3Rpb25EYXRhAAAAAAUAAAAAAAAAB2JpZGRlcnMAAAAD6gAAABMAAAAAAAAACGRlYWRsaW5lAAAABgAAAAAAAAALaGlnaGVzdF9iaWQAAAAACwAAAAAAAAAOaGlnaGVzdF9iaWRkZXIAAAAAA+gAAAATAAAAAAAAAAlpc19hY3RpdmUAAAAAAAAB"]), options);
        this.options = options;
    }
    fromJSON = {
        bid: (this.txFromJSON),
        cancel: (this.txFromJSON),
        finalize: (this.txFromJSON),
        get_admin: (this.txFromJSON),
        get_token: (this.txFromJSON),
        get_bidders: (this.txFromJSON),
        reset_auction: (this.txFromJSON),
        get_auction_data: (this.txFromJSON)
    };
}
