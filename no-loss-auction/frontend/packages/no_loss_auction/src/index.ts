import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
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
    contractId: "CCHWSSU5SXNTWAZKPMJRCRR6PCKFW5BIWKIXMBQXQY2YMOME4CVKWMF2",
  },
} as const;

export type DataKey =
  | { tag: "Admin"; values: void }
  | { tag: "Token"; values: void }
  | { tag: "AuctionData"; values: void };

export interface AuctionData {
  bidders: Array<string>;
  deadline: u64;
  highest_bid: i128;
  highest_bidder: Option<string>;
  is_active: boolean;
}

export interface Client {
  /**
   * Construct and simulate a bid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  bid: (
    { bidder, amount }: { bidder: string; amount: i128 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a cancel transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancels the auction ONLY if no bids exist (Admin Only)
   */
  cancel: (options?: MethodOptions) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a finalize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Finalizes the auction after the deadline (Permissionless)
   */
  finalize: (options?: MethodOptions) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a get_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_token: (options?: MethodOptions) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a get_bidders transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_bidders: (
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<Array<string>>>;

  /**
   * Construct and simulate a reset_auction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Resets the contract for a brand new auction. (Admin Only)
   */
  reset_auction: (
    { new_deadline }: { new_deadline: u64 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a get_auction_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_auction_data: (
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<AuctionData>>;
}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin, token, deadline }: { admin: string; token: string; deadline: u64 },
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      },
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({ admin, token, deadline }, options);
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        "AAAAAAAAAAAAAAADYmlkAAAAAAIAAAAAAAAABmJpZGRlcgAAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAADZDYW5jZWxzIHRoZSBhdWN0aW9uIE9OTFkgaWYgbm8gYmlkcyBleGlzdCAoQWRtaW4gT25seSkAAAAAAAZjYW5jZWwAAAAAAAAAAAAA",
        "AAAAAAAAADlGaW5hbGl6ZXMgdGhlIGF1Y3Rpb24gYWZ0ZXIgdGhlIGRlYWRsaW5lIChQZXJtaXNzaW9ubGVzcykAAAAAAAAIZmluYWxpemUAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAJZ2V0X3Rva2VuAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAALZ2V0X2JpZGRlcnMAAAAAAAAAAAEAAAPqAAAAEw==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAMAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAhkZWFkbGluZQAAAAYAAAAA",
        "AAAAAAAAADlSZXNldHMgdGhlIGNvbnRyYWN0IGZvciBhIGJyYW5kIG5ldyBhdWN0aW9uLiAoQWRtaW4gT25seSkAAAAAAAANcmVzZXRfYXVjdGlvbgAAAAAAAAEAAAAAAAAADG5ld19kZWFkbGluZQAAAAYAAAAA",
        "AAAAAAAAAAAAAAAQZ2V0X2F1Y3Rpb25fZGF0YQAAAAAAAAABAAAH0AAAAAtBdWN0aW9uRGF0YQA=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAFVG9rZW4AAAAAAAAAAAAAAAAAAAtBdWN0aW9uRGF0YQA=",
        "AAAAAQAAAAAAAAAAAAAAC0F1Y3Rpb25EYXRhAAAAAAUAAAAAAAAAB2JpZGRlcnMAAAAD6gAAABMAAAAAAAAACGRlYWRsaW5lAAAABgAAAAAAAAALaGlnaGVzdF9iaWQAAAAACwAAAAAAAAAOaGlnaGVzdF9iaWRkZXIAAAAAA+gAAAATAAAAAAAAAAlpc19hY3RpdmUAAAAAAAAB",
      ]),
      options,
    );
  }
  public readonly fromJSON = {
    bid: this.txFromJSON<null>,
    cancel: this.txFromJSON<null>,
    finalize: this.txFromJSON<null>,
    get_admin: this.txFromJSON<string>,
    get_token: this.txFromJSON<string>,
    get_bidders: this.txFromJSON<Array<string>>,
    reset_auction: this.txFromJSON<null>,
    get_auction_data: this.txFromJSON<AuctionData>,
  };
}
