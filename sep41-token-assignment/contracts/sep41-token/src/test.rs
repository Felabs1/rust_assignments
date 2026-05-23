#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};

use crate::our_token::{SibToken, SibTokenClient};

struct SetUpResult<'a> {
    env: Env,
    client: SibTokenClient<'a>,
    admin: Address,
    sender: Address,
    receiver: Address,
}

fn setup<'a>() -> SetUpResult<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    // __constructor mints initial supply to admin at deploy time
    let contract_id = env.register(SibToken, (&admin, &1_000_000_i128));

    let client = SibTokenClient::new(&env, &contract_id);

    // Give sender a working balance of 1_000 tokens
    client.transfer(&admin, &sender, &1_000_i128);

    SetUpResult {
        env,
        client,
        admin,
        sender,
        receiver,
    }
}


#[test]
fn test_name() {
    let s = setup();
    assert_eq!(s.client.name(), String::from_str(&s.env, "SibToken"));
}

#[test]
fn test_symbol() {
    let s = setup();
    let sym = s.client.symbol();
    assert_eq!(sym, String::from_str(&s.env, "SIB"));
    assert_ne!(sym, String::from_str(&s.env, "Sib")); // case-sensitive
}

#[test]
fn test_decimal() {
    let s = setup();
    assert_eq!(s.client.decimals(), 18_u32);
}

// following through that minting should happen on the constructor
#[test]
fn test_constructor_mints_initial_supply_to_admin() {
    let setup_result = setup();

    // admin started with 1_000_000 and sent 1_000 to sender in setup
    let admin_balance = setup_result.client.balance(&setup_result.admin);
    let expected_balance = 1_000_000 - 1_000;
    assert_eq!(admin_balance, expected_balance);
}

// test for minting
#[test]
fn test_mint() {
    let s = setup();
    // admin mints 500 directly to receiver
    s.client.mint(&s.admin, &500_i128);
    // receiver still 0 — mint went to admin above; transfer to receiver
    s.client.transfer(&s.admin, &s.receiver, &500_i128);
    assert_eq!(s.client.balance(&s.receiver), 500);
}

// test for transfer
#[test]
fn test_transfer() {
    let s = setup();

    // sender starts with 1_000
    assert_eq!(s.client.balance(&s.sender), 1_000);

    s.client.transfer(&s.sender, &s.receiver, &400_i128);

    assert_eq!(s.client.balance(&s.sender), 600);
    assert_eq!(s.client.balance(&s.receiver), 400);
}


// test for transfer of insufficient funds
#[test]
fn test_transfer_insufficient_funds() {
    let s = setup();

    let result = s.client.try_transfer(&s.sender, &s.receiver, &9_999_i128);
    assert!(result.is_err());
}

// test for approve and transfer from
#[test]
fn test_approve_and_transfer_from() {
    let s = setup();
    let spender = Address::generate(&s.env);

    // sender approves spender for 300
    s.client.approve(&s.sender, &spender, &300_i128, &1_000_u32);
    assert_eq!(s.client.allowance(&s.sender, &spender), 300);

    // spender moves 200 from sender → receiver
    s.client.transfer_from(&spender, &s.sender, &s.receiver, &200_i128);

    assert_eq!(s.client.balance(&s.sender), 800);
    assert_eq!(s.client.balance(&s.receiver), 200);
    // allowance reduced
    assert_eq!(s.client.allowance(&s.sender, &spender), 100);
}

// test transfer from if allowance is insufficient
#[test]
fn test_transfer_from_insufficient_allowance() {
    let s = setup();
    let spender = Address::generate(&s.env);

    s.client.approve(&s.sender, &spender, &100_i128, &1_000_u32);

    let result = s
        .client
        .try_transfer_from(&spender, &s.sender, &s.receiver, &500_i128);
    assert!(result.is_err());
}

// test burn
#[test]
fn test_burn() {
    let s = setup();

    s.client.burn(&s.sender, &200_i128);

    assert_eq!(s.client.balance(&s.sender), 800);
}

// test burn if funds is insufficient

#[test]
fn test_burn_insufficient_funds() {
    let s = setup();

    let result = s.client.try_burn(&s.sender, &5_000_i128);
    assert!(result.is_err());
}

// testing the function burn from
#[test]
fn test_burn_from() {
    let s = setup();
    let spender = Address::generate(&s.env);

    s.client.approve(&s.sender, &spender, &300_i128, &1_000_u32);

    s.client.burn_from(&spender, &s.sender, &150_i128);

    assert_eq!(s.client.balance(&s.sender), 850);
    assert_eq!(s.client.allowance(&s.sender, &spender), 150);
}

// testing burn from if funds is insufficient
#[test]
fn test_burn_from_insufficient_allowance() {
    let s = setup();
    let spender = Address::generate(&s.env);

    s.client.approve(&s.sender, &spender, &50_i128, &1_000_u32);

    let result = s.client.try_burn_from(&spender, &s.sender, &200_i128);
    assert!(result.is_err());
}





