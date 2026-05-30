use soroban_sdk::{contract, contractimpl, Address, Env, token, Vec};
use crate::{storage::{DataKey, AuctionData}};
#[contract]
pub struct NoLossAuction;

#[contractimpl]
impl NoLossAuction {
    // writing our initialization
    pub fn __constructor(env: &Env, admin: Address, token: Address, deadline: u64) {
        // an inbuilt method to require authorization from Admin
        admin.require_auth();

        // storing the immutable configurations
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);

        // initialize and store the auction state
        let auction_data = AuctionData {
            deadline,
            highest_bidder: None,
            highest_bid: 0,
            is_active: true,
            bidders: Vec::new(env),
        };

        env.storage().instance().set(&DataKey::AuctionData, &auction_data);
    }

    pub fn bid(env: &Env, bidder: Address, amount: i128) {
        bidder.require_auth();

        let mut auction_data: AuctionData = env.storage().instance().get(&DataKey::AuctionData).unwrap();
        // enforce structural conditions
        if !auction_data.is_active {
            panic!("auction is no longer active");
        }

        if env.ledger().timestamp() >= auction_data.deadline {
            panic!("Auction has allready passed it's deadline");
        }

        if amount <=auction_data.highest_bid {
            panic!("Bid amount must be strictly greater than the current highest bid");
        }

        // initializing the sep41 token client
        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(env, &token_address);

        token_client.transfer(&bidder, &env.current_contract_address(), &amount);

        if let Some(previous_bidder) = auction_data.highest_bidder {
            token_client.transfer(
                &env.current_contract_address(),
                &previous_bidder,
                &auction_data.highest_bid,
            );
        }

        //  Mutate storage state with new high markets
        auction_data.highest_bidder = Some(bidder.clone());
        auction_data.highest_bid = amount;
        auction_data.bidders.push_back(bidder);

        env.storage().instance().set(&DataKey::AuctionData, &auction_data);
    }

   /// Finalizes the auction after the deadline (Permissionless)
    pub fn finalize(env: &Env) {
        let mut auction_data: AuctionData = env
            .storage()
            .instance()
            .get(&DataKey::AuctionData)
            .unwrap();

        if !auction_data.is_active {
            panic!("Auction is already closed");
        }
        
        // Exact string match required for the test
        if env.ledger().timestamp() < auction_data.deadline {
            panic!("Cannot finalize auction before the deadline");
        }

        if auction_data.highest_bid > 0 {
            let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
            let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
            let token_client = token::Client::new(env, &token_address);

            token_client.transfer(
                &env.current_contract_address(),
                &admin,
                &auction_data.highest_bid,
            );
        }

        auction_data.is_active = false;
        env.storage().instance().set(&DataKey::AuctionData, &auction_data);
    }

    /// Cancels the auction ONLY if no bids exist (Admin Only)
    pub fn cancel(env: &Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut auction_data: AuctionData = env
            .storage()
            .instance()
            .get(&DataKey::AuctionData)
            .unwrap();

        if !auction_data.is_active {
            panic!("Auction is already closed");
        }
        
        // MUST be is_some() (Meaning: "If there is a bidder, panic")
        // Exact string match required for the test
        if auction_data.highest_bidder.is_some() {
            panic!("Cannot cancel an auction that already has bids");
        }

        auction_data.is_active = false;
        env.storage().instance().set(&DataKey::AuctionData, &auction_data);
    }


    /// Resets the contract for a brand new auction. (Admin Only)
    pub fn reset_auction(env: &Env, new_deadline: u64) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut auction_data: AuctionData = env
            .storage()
            .instance()
            .get(&DataKey::AuctionData)
            .unwrap();

        // 1. Safety guard: Ensure the previous auction is fully closed
        if auction_data.is_active {
            panic!("Cannot reset while an auction is still active");
        }

        // 2. Wipe the slate clean and set the new deadline
        auction_data.deadline = new_deadline;
        auction_data.highest_bidder = None;
        auction_data.highest_bid = 0;
        auction_data.is_active = true;
        
        // 3. Clear the historical bidders list
        auction_data.bidders = soroban_sdk::Vec::new(env); 

        // 4. Save the fresh state to the ledger
        env.storage().instance().set(&DataKey::AuctionData, &auction_data);
    }


    // getter functions
    pub fn get_auction_data(env: &Env) -> AuctionData {
        env.storage().instance().get(&DataKey::AuctionData).unwrap()
    }

    pub fn get_token(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    pub fn get_admin(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_bidders(env: &Env) -> Vec<Address> {
        let auction_data: AuctionData = env.storage().instance().get(&DataKey::AuctionData).unwrap();
        auction_data.bidders
    }
}