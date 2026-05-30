#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, token, Address, Env};
use crate::no_loss_auction::{NoLossAuction, NoLossAuctionClient};

// Helper struct to hold our testing environment variables
struct SetUpResult<'a> {
    env: Env,
    client: NoLossAuctionClient<'a>,
    admin: Address,
    bidder1: Address,
    bidder2: Address,
    token_client: token::StellarAssetClient<'a>,
    token_id: Address, 
    deadline: u64,     
}

// The setup fixture that initializes the ledger before every test
fn setup<'a>() -> SetUpResult<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let bidder1 = Address::generate(&env);
    let bidder2 = Address::generate(&env);

    // Create a mock USDC token using the modern v2 method
    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_client = token::StellarAssetClient::new(&env, &token_id);

    // Mint starting balances to our bidders
    token_client.mint(&bidder1, &1000);
    token_client.mint(&bidder2, &1000);

    // Set deadline to 1 hour in the future
    let deadline = env.ledger().timestamp() + 3600;

    // Register the contract AND pass constructor args in one modern step
    let contract_id = env.register(NoLossAuction, (&admin, &token_id, &deadline));
    let client = NoLossAuctionClient::new(&env, &contract_id);

    SetUpResult {
        env,
        client,
        admin,
        bidder1,
        bidder2,
        token_client,
        token_id, 
        deadline, 
    }
}

#[test]
fn test_no_loss_refund_mechanism() {
    let setup = setup();

    setup.client.bid(&setup.bidder1, &100);
    setup.client.bid(&setup.bidder2, &200);

    assert_eq!(setup.token_client.balance(&setup.bidder1), 1000); 
    assert_eq!(setup.token_client.balance(&setup.bidder2), 800);  
    assert_eq!(setup.token_client.balance(&setup.client.address), 200); 
}

#[test]
#[should_panic(expected = "Bid amount must be strictly greater than the current highest bid")]
fn test_bid_too_low_panics() {
    let setup = setup();
    setup.client.bid(&setup.bidder1, &100);
    setup.client.bid(&setup.bidder2, &100);
}

/* --- 2. FINALIZATION TESTS --- */

#[test]
fn test_finalize_with_winner_transfers_funds() {
    let setup = setup();
    let native_token = token::Client::new(&setup.env, &setup.token_id);

    setup.client.bid(&setup.bidder1, &500);

    // Fast forward the ledger time past the 1-hour deadline
    setup.env.ledger().set_timestamp(setup.deadline + 1);

    setup.client.finalize();

    assert_eq!(native_token.balance(&setup.client.address), 0);
    assert_eq!(native_token.balance(&setup.admin), 500);

    let data = setup.client.get_auction_data();
    assert!(!data.is_active);
}

#[test]
#[should_panic(expected = "Cannot finalize auction before the deadline")]
fn test_finalize_before_deadline_panics() {
    let setup = setup();
    setup.client.bid(&setup.bidder1, &100);
    setup.client.finalize();
}

/* --- 3. CANCELLATION TESTS --- */

#[test]
fn test_admin_can_cancel_with_zero_bids() {
    let setup = setup();
    setup.client.cancel();

    let data = setup.client.get_auction_data();
    assert!(!data.is_active);
}

#[test]
#[should_panic(expected = "Cannot cancel an auction that already has bids")]
fn test_cancel_with_existing_bids_panics() {
    let setup = setup();
    setup.client.bid(&setup.bidder1, &100);
    setup.client.cancel();
}

/* --- 4. VIEW / GETTER TESTS --- */

#[test]
fn test_getters_and_bidder_history_tracking() {
    let setup = setup();

    assert_eq!(setup.client.get_admin(), setup.admin);
    assert_eq!(setup.client.get_token(), setup.token_id);

    setup.client.bid(&setup.bidder1, &100);
    setup.client.bid(&setup.bidder2, &150);
    setup.client.bid(&setup.bidder1, &200);

    let history = setup.client.get_bidders();
    assert_eq!(history.len(), 3);
    assert_eq!(history.get(0).unwrap(), setup.bidder1);
    assert_eq!(history.get(1).unwrap(), setup.bidder2);
    assert_eq!(history.get(2).unwrap(), setup.bidder1);
}